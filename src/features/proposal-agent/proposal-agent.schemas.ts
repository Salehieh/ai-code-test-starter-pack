import { z } from 'zod';

// The contract for the structured information we extract from an unstructured RFP.
export const ExtractedRequirementsSchema = z.object({
  eventType: z.string().describe("The type of event, e.g., 'board meeting', 'product launch', 'wedding'"),
  guestCount: z.number().positive().describe("The number of guests"),
  dates: z.object({
    start: z.string().datetime().describe("Start date and time in ISO 8601 format"),
    end: z.string().datetime().describe("End date and time in ISO 8601 format"),
  }).describe("The dates of the event"),
  budget: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().default('EUR'),
  }).describe("The customer's budget"),
  specialRequests: z.array(z.string()).describe("A list of specific requests, e.g., 'projector', 'dietary accommodations'"),
});

// The contract for a single step in the agent's plan.
// We use discriminatedUnion for maximum type safety.
export const ProposalPlanStepSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('add_product'),
    productId: z.string().describe("ID of the product from the hotel's content library"),
    justification: z.string().describe("Why this product was chosen based on the RFP"),
  }),
  z.object({
    type: z.literal('add_custom_text'),
    title: z.string().describe("The heading for the text block"),
    body: z.string().describe("The body text to be written, e.g., a welcome greeting"),
  }),
]);

// The contract for the entire plan, which is a sequence of steps.
export const ProposalPlanSchema = z.array(ProposalPlanStepSchema);

// The contract for the result of our quality evaluation.
export const EvaluationResultSchema = z.object({
  completeness: z.object({
    score: z.number().min(1).max(5),
    reasoning: z.string(),
  }).describe("How well all parts of the RFP have been addressed."),
  relevance: z.object({
    score: z.number().min(1).max(5),
    reasoning: z.string(),
  }).describe("How relevant the chosen products are."),
  professionalism: z.object({
    score: z.number().min(1).max(5),
    reasoning: z.string(),
  }).describe("The quality of the generated text and tone."),
});

// We also export the TypeScript types for easy use in our code.
export type ExtractedRequirements = z.infer<typeof ExtractedRequirementsSchema>;
export type ProposalPlan = z.infer<typeof ProposalPlanSchema>;
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;