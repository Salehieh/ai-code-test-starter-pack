import { EvaluationScorecard, EvaluationScorecardSchema } from './evaluation.schemas';
import { ExtractedRequirements, ProposalPlan } from '../proposal-agent/proposal-agent.schemas';
import { getStructuredResponse } from '../../core/llm-utils';

/**
 * Step 5: The Quality Assurance Inspector.
 * Uses a mix of deterministic heuristics and LLM-as-a-judge to evaluate
 * the final proposal against the original customer request.
 */
export async function evaluateProposal(
  rfpText: string,
  requirements: ExtractedRequirements,
  plan: ProposalPlan
): Promise<EvaluationScorecard> {
  console.log('\n--- ⚖️ Starting evaluateProposal (Quality Assurance) ---');

  // 1. HEURISTIC CHECKS (Fast, deterministic)
  // We don't trust the LLM to do basic math or boolean logic. We do it here.
  const heuristicFailures: string[] = [];

  // Check 1: Did we lose the dates?
  if (requirements.dates?.start && !plan.proposedDates?.start) {
    heuristicFailures.push("CRITICAL ERROR: Original RFP specified a start date, but the generated plan omitted it.");
  }

  // Check 2: Simple product quantity sanity check vs requested guests
  const totalQuantity = plan.steps.reduce((acc, step) => step.type === 'add_product' ? acc + step.quantity : acc, 0);
  if (requirements.guestCount?.primary && totalQuantity === 0) {
    heuristicFailures.push("CRITICAL ERROR: RFP requested attendees, but no products with a quantity > 0 were added.");
  }

  // 2. LLM-BASED EVALUATION (Nuanced, subjective grading)
  const systemPrompt = `You are a concise, highly critical Senior Quality Assurance Auditor for a premium hotel group.
  Your job is to review a proposed event plan against the client's original Request for Proposal (RFP).
  
  RULES:
  1. You MUST be highly critical, but your reasoning MUST be concise. Do not write an essay.
  2. Write your 'reasoning' using a short, bulleted list. You MUST start each bullet point with a bold label like **Success:**, **Critical Gap:**, or **Tone:** to make it easily scannable.
  3. You MUST sort your bullet points in this exact order: First list all **Success:** points, then add a blank line, then list all **Critical Gap:** points, then add a blank line, and finally end with the **Tone:** point.
  4. If the plan misses ANY specific request (like a dietary requirement or specific equipment), list it in 'missedRequirements'.
  5. Do NOT penalize the plan for missing a budget breakdown, as the AI does not have access to pricing data.
  6. PREMIUM BRAND ALIGNMENT: Grade the 'toneScore' strictly on whether the proposal sounds luxurious, bespoke, and professional. Penalize robotic or cheap transactional language.
  7. 'isApproved' MUST be false if there are any missed requirements or if the final score is below 80.`;

  const userPrompt = `--- ORIGINAL RFP FROM CLIENT ---
  ${rfpText}
  
  --- PROPOSED PLAN BY AI AGENT ---
  ${JSON.stringify(plan, null, 2)}
  
  Please provide your harsh and honest evaluation scorecard.`;

  // Manual JSON Schema override to bypass zod-to-json-schema issues and guarantee a perfect tool call.
  const manualEvalJsonSchema = {
    type: "object",
    properties: {
      reasoning: { type: "string" },
      missedRequirements: { type: "array", items: { type: "string" } },
      toneScore: { type: "number" },
      accuracyScore: { type: "number" },
      finalScore: { type: "number" },
      isApproved: { type: "boolean" }
    },
    required: ["reasoning", "missedRequirements", "toneScore", "accuracyScore", "finalScore", "isApproved"],
    additionalProperties: false
  };

  console.log('▶️ Calling LLM Judge for qualitative evaluation...');
  
  try {
    const llmScorecard = await getStructuredResponse(
      systemPrompt,
      userPrompt,
      EvaluationScorecardSchema,
      manualEvalJsonSchema
    );

    // 3. RECONCILE SCORES
    // If our deterministic code found a failure, we override the LLM's potential leniency.
    if (heuristicFailures.length > 0) {
      console.warn('⚠️ Heuristic checks failed! Overriding LLM score.');
      llmScorecard.finalScore = Math.min(llmScorecard.finalScore, 40); // Cap score severely
      llmScorecard.isApproved = false;
      
      // We push our hard failures into the list so the frontend sees them
      for (const failure of heuristicFailures) {
          if (!llmScorecard.missedRequirements.includes(failure)) {
              llmScorecard.missedRequirements.push(failure);
          }
      }
    }

    console.log(`✅ Evaluation complete. Final Score: ${llmScorecard.finalScore}/100. Approved: ${llmScorecard.isApproved}`);
    console.log('--- 🏁 evaluateProposal Completed ---\n');

    return llmScorecard;

  } catch (error) {
    console.error('❌ evaluateProposal failed.', error);
    throw new Error("Evaluation step failed.");
  }
}

export const EvaluationService = {
  evaluateProposal
};