import {
  ExtractedRequirements,
  ExtractedRequirementsSchema,
  ProposalPlan,
  ProposalPlanSchema,
  ProposalPlanStep,
} from './proposal-agent.schemas';
import { getStructuredResponse } from '../../core/llm-utils';
import { VectorStore } from '../../core/vector-store';
import { ProposalesProduct } from '../../core/proposales-client/proposales-client.schemas';
import { CreateProposalPayload } from '../../core/proposales-client/proposales-client.schemas';

/**
 * Step 1 in our agent pipeline: Extract structured requirements from an unstructured RFP.
 * @param rfpText The raw text from the customer's request.
 * @returns A promise resolving to a validated ExtractedRequirements object.
 */
async function extractRequirements(rfpText: string): Promise<ExtractedRequirements> {
  const systemPrompt = `You are a highly intelligent data extraction agent. Your sole purpose is to analyze a user's Request for Proposal (RFP) and populate the fields of the 'format_response' tool.

  RULES:
  1. Adhere STRICTLY to the JSON schema provided in the tool. The field descriptions are your primary source of truth.
  2. DO NOT invent or assume any information that is not explicitly present in the RFP text.
  3. If a REQUIRED field is unclear, make your best reasoned extraction based on the text.
  4. If an OPTIONAL field is missing or cannot be confidently inferred from the text, you MUST omit it. Do not use placeholders like 'N/A'.
  5. For dates, always populate the 'description' field with the original text. Only populate 'start' and 'end' if you can confidently parse a full ISO 8601 datetime.
  
  Today's date is ${new Date().toISOString().split('T')[0]}.`;
  
  const userPrompt = `Please extract all relevant information from the following RFP:
  
  --- RFP TEXT ---
  ${rfpText}
  --- END RFP TEXT ---`;

  console.log('▶️ Calling LLM to extract requirements...');
  
  try {
    
    // THE ULTIMATE OVERRIDE
    // Since zod-to-json-schema is completely failing to translate our simple schema,
    // we bypass it and define the contract explicitly. This guarantees robustness.
    const manualJsonSchema = {
      type: "object",
      properties: {
        eventType: {
          type: "string",
          description: "The main type of event, like 'wedding', 'board meeting', or 'conference'. If unclear, summarize it."
        },
        guestCount: {
          type: "object",
          description: "Information about the number of attendees. Omit if not mentioned.",
          properties: {
            primary: {
              type: "number",
              description: "The primary or maximum number of guests."
            },
            description: {
              type: "string",
              description: "Additional details on guest counts, e.g., '50 for dinner'."
            }
          },
          required: ["primary"],
          additionalProperties: false
        },
        dates: {
          type: "object",
          description: "Information on event dates. Omit if not mentioned.",
          properties: {
            start: {
              type: "string",
              description: "The start date in ISO 8601 format, if a specific date is clear."
            },
            end: {
              type: "string",
              description: "The end date in ISO 8601 format, if a specific date is clear."
            },
            description: {
              type: "string",
              description: "The original date text from the RFP, like 'May 15th' or 'flexible in June'."
            }
          },
          required: ["description"],
          additionalProperties: false
        },
        budget: {
          type: "object",
          description: "The customer's budget. Omit if not mentioned.",
          properties: {
            min: {
              type: "number",
              description: "The minimum budget if a range is given."
            },
            max: {
              type: "number",
              description: "The maximum or approximate budget amount."
            },
            currency: {
              type: "string",
              default: "EUR"
            },
            description: {
              type: "string",
              description: "Original budget text with nuances, e.g., 'around 2000' or 'excluding accommodation'."
            }
          },
          additionalProperties: false
        },
        specialRequests: {
          type: "array",
          description: "A list of specific requirements like 'projector', 'spa access', or '40 hotel rooms'.",
          items: {
            type: "string"
          }
        }
      },
      required: ["eventType"],
      additionalProperties: false
    };

    const extractedData = await getStructuredResponse(
      systemPrompt,
      userPrompt,
      ExtractedRequirementsSchema,
      manualJsonSchema
    );
    console.log('✅ LLM extraction successful and validated.');
    
    return extractedData;
  } catch (error) {
     console.error('❌ extractRequirements failed.');
     throw error; // Re-throw to be handled by the controller
  }
}

/**
 * Step 2 in our agent pipeline: "Smart Retrieve".
 * Generates multiple specific search queries based on the extracted requirements,
 * searches the vector database in parallel, and merges/deduplicates the results.
 */
async function retrieveProducts(
  requirements: ExtractedRequirements,
  vectorStore: VectorStore
): Promise<ProposalesProduct[]> {
  console.log('\n--- 🚀 Starting retrieveProducts ---');
  
  const searchQueries: string[] = [];

  // 1. Base search: Event type + optional guest count (provides good context for rooms/venues)
  let baseQuery = requirements.eventType || 'event space';
  if (requirements.guestCount?.primary) {
      baseQuery += ` for ${requirements.guestCount.primary} guests`;
  }
  searchQueries.push(baseQuery);

  // 2. Specific searches for each "specialRequest"
  if (requirements.specialRequests && requirements.specialRequests.length > 0) {
      for (const request of requirements.specialRequests) {
          // We retain the guest count in the context for specific requests too (e.g., "lunch for 50")
          const query = requirements.guestCount?.primary 
              ? `${request} for ${requirements.guestCount.primary}`
              : request;
          searchQueries.push(query);
      }
  }

  console.log('🔍 Generated Semantic Search Queries:', searchQueries);

  // 3. Execute all searches in parallel for maximum performance ("Simple solutions over clever ones")
  // We fetch top 3 for each specific query.
  const searchPromises = searchQueries.map(query => vectorStore.search(query, 3));
  const resultsArray = await Promise.all(searchPromises);

  // 4. Flatten the array of arrays into a single array of products
  const allRetrievedProducts = resultsArray.flat();

  // 5. Deduplicate results based on product_id
  const uniqueProductsMap = new Map<number, ProposalesProduct>();
  for (const product of allRetrievedProducts) {
      if (!uniqueProductsMap.has(product.product_id)) {
          uniqueProductsMap.set(product.product_id, product);
      }
  }

  const curatedCatalog = Array.from(uniqueProductsMap.values());
  
  console.log(`✅ Retrieved and deduplicated ${curatedCatalog.length} unique products for the catalog.`);
  console.log('--- 🏁 retrieveProducts Completed ---\n');

  return curatedCatalog;
}

/**
 * Step 3 in our agent pipeline: "Plan".
 * Uses the LLM to build a logical plan (array of actions) based on
 * the RFP, the structured requirements, and the products retrieved in Step 2.
 */
async function generateProposalPlan(
  rfpText: string,
  requirements: ExtractedRequirements,
  catalog: ProposalesProduct[]
): Promise<ProposalPlan> {
  console.log('\n--- 🚀 Starting generateProposalPlan ---');

  const systemPrompt = `You are an elite event planner for a premium hotel. Your task is to generate a comprehensive, professional proposal plan.
  
  RULES:
  1. You must output a structured plan using the provided JSON schema.
  2. You have been provided with a "Curated Catalog" of products. You MAY ONLY USE products from this catalog for the 'add_product' steps.
  3. If you decide to add a product from the catalog, you MUST use the exact 'product_id' and 'variation_id' provided.
  4. Build the proposal logically. Start with a warm 'add_custom_text' welcome message. Then logically group the required products. End with a polite closing text.
  5. CRITICAL MATH: If specific quantities are requested (e.g., '40 hotel rooms' or '120 guests'), you MUST ensure the sum of your 'quantity' fields perfectly matches the request.
  6. CRITICAL OMISSIONS: If the client requests something that is NOT in the Curated Catalog (e.g., specific dietary meals, spa access, florals), you MUST add an 'add_custom_text' block explicitly acknowledging that specific request and assuring the client that the hotel team will arrange it. DO NOT IGNORE ANY REQUESTS.
  7. The 'justification' field is for your internal reasoning. Explain *why* you chose this product for this client based on their request.
  
  Today's date is ${new Date().toISOString().split('T')[0]}.`;

  // We feed the LLM exactly what it needs: The raw intent, the parsed intent, and the available tools (products).
  const userPrompt = `--- ORIGINAL RFP ---
  ${rfpText}
  
  --- EXTRACTED REQUIREMENTS ---
  ${JSON.stringify(requirements, null, 2)}
  
  --- CURATED CATALOG (ONLY USE THESE PRODUCTS) ---
  ${JSON.stringify(catalog.map(p => ({
    product_id: p.product_id,
    variation_id: p.variation_id,
    name: p.title.en,
    description: p.description?.en || ''
  })), null, 2)}
  
  Please generate the proposal plan.`;

  console.log('▶️ Calling LLM to generate the proposal plan...');

  try {
    // THE ULTIMATE OVERRIDE FOR DISCRIMINATED UNIONS
    // zod-to-json-schema completely fails on z.discriminatedUnion in strict mode.
    // We must manually define the precise JSON Schema contract for OpenAI.
    const manualPlanJsonSchema = {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "A professional, catchy title for the entire proposal (e.g., 'Quarterly Board Meeting at Grand Hotel')."
        },
        proposedDates: {
          type: "object",
          description: "The finalized dates for the proposal based on the RFP.",
          properties: {
            start: { type: "string", description: "The proposed start date (ISO 8601). Leave blank if impossible to determine." },
            end: { type: "string", description: "The proposed end date (ISO 8601). Leave blank if impossible to determine." }
          },
          additionalProperties: false
        },
        steps: {
          type: "array",
          description: "The sequence of blocks that make up the proposal. Order matters.",
          items: {
            type: "object",
            // We use a flat object for the LLM to avoid 'oneOf' confusion,
            // but force it to pick a specific 'type' enum.
            properties: {
              type: { 
                type: "string", 
                enum: ["add_product", "add_custom_text"],
                description: "CRITICAL: You must choose either 'add_product' or 'add_custom_text'."
              },
              // Fields for add_product
              productId: { type: "number", description: "Required if type is 'add_product'." },
              variationId: { type: "number", description: "Required if type is 'add_product'." },
              productName: { type: "string", description: "Required if type is 'add_product'." },
              quantity: { type: "number", description: "Required if type is 'add_product'." },
              justification: { type: "string", description: "Required if type is 'add_product'." },
              // Fields for add_custom_text
              title: { type: "string", description: "Required if type is 'add_custom_text'." },
              body: { type: "string", description: "Required if type is 'add_custom_text'." }
            },
            required: ["type"],
            additionalProperties: false
          }
        }
      },
      required: ["title", "proposedDates", "steps"],
      additionalProperties: false
    };

    const proposalPlan = await getStructuredResponse(
      systemPrompt,
      userPrompt,
      ProposalPlanSchema,
      manualPlanJsonSchema
    );

    console.log('✅ LLM planning successful and validated.');
    console.log('--- 🏁 generateProposalPlan Completed ---\n');
    
    return proposalPlan;
  } catch (error) {
    console.error('❌ generateProposalPlan failed.');
    throw error;
  }
}

/**
 * Step 4 in our agent pipeline: "Assemble".
 * A 100% deterministic function that maps the AI's logical plan into the exact
 * JSON payload required by the Proposales API. No LLM involved here.
 */
function assembleProposal(plan: ProposalPlan, companyId: number): CreateProposalPayload {
  console.log('\n--- 🚀 Starting assembleProposal (Deterministic Assembly) ---');

  let descriptionMd = '';
  const blocks: any[] = [];

  // Add proposed dates to the top of the description if they exist
  if (plan.proposedDates?.start || plan.proposedDates?.end) {
      descriptionMd += `**Proposed Dates:** ${plan.proposedDates.start || 'TBD'} to ${plan.proposedDates.end || 'TBD'}\n\n`;
  }

  // Iterate through the steps and map them to the platform's constraints.
  // Note: Proposales V3 'blocks' array only supports product/video blocks.
  // Therefore, custom text is gracefully combined into the 'description_md' field.
  for (const step of plan.steps) {
      if (step.type === 'add_custom_text') {
          descriptionMd += `# ${step.title}\n${step.body}\n\n`;
      } else if (step.type === 'add_product') {
          blocks.push({
              content_id: step.variationId, // CRITICAL: The API requires variation_id here, not product_id
              type: 'product-block',
              quantity: step.quantity // Passed as additional block data
          });
      }
  }

  const payload: CreateProposalPayload = {
      company_id: companyId,
      language: 'en',
      title_md: plan.title,
      description_md: descriptionMd.trim(),
      blocks: blocks
  };

  console.log(`✅ Mapped ${plan.steps.length} plan steps to ${blocks.length} API blocks and ${descriptionMd.length} chars of markdown.`);
  console.log('--- 🏁 assembleProposal Completed ---\n');

  return payload;
}

// We expose our service as an object of functions for easy mocking and testing.
export const ProposalAgentService = {
  extractRequirements,
  retrieveProducts,
  generateProposalPlan,
  assembleProposal,
};
