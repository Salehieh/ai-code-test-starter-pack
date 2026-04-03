import {
  ExtractedRequirements,
  ExtractedRequirementsSchema,
} from './proposal-agent.schemas';
import { getStructuredResponse } from '../../core/llm-utils';

/**
 * Steg 1 i vår agent-pipeline: Extrahera strukturerade krav från en ostrukturerad RFP.
 * @param rfpText Den råa texten från kundens förfrågan.
 * @returns Ett promise som resolverar till ett validerat ExtractedRequirements-objekt.
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

// Vi bygger upp vår service som ett objekt av funktioner.
export const ProposalAgentService = {
  extractRequirements,
};
