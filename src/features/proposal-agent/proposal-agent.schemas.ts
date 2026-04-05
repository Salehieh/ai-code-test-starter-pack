import { z } from 'zod';

// The forgiving, robust version of our extraction schema.
export const ExtractedRequirementsSchema = z.object({
  eventType: z.string().describe("The main type of event, like 'wedding', 'board meeting', or 'conference'. If unclear, summarize it."),
  
  guestCount: z.object({
    primary: z.number().describe("The primary or maximum number of guests."),
    description: z.string().optional().describe("Additional details on guest counts, e.g., '50 for dinner'."),
  }).optional().describe("Information about the number of attendees. Omit if not mentioned."),
  
  dates: z.object({
    start: z.string().optional().describe("The start date in ISO 8601 format, if a specific date is clear."),
    end: z.string().optional().describe("The end date in ISO 8601 format, if a specific date is clear."),
    description: z.string().describe("The original date text from the RFP, like 'May 15th' or 'flexible in June'."),
  }).optional().describe("Information on event dates. Omit if not mentioned."),
  
  budget: z.object({
    min: z.number().optional().describe("The minimum budget if a range is given."),
    max: z.number().optional().describe("The absolute maximum budget if a hard limit is given."),
    approximate: z.number().optional().describe("The approximate budget if words like 'around', 'roughly', or 'about' are used."),
    currency: z.string().default('EUR'),
    description: z.string().optional().describe("Original budget text with nuances, e.g., 'around 2000' or 'excluding accommodation'."),
  }).optional().describe("The customer's budget. Omit if not mentioned."),

  specialRequests: z.array(z.string()).optional().describe("A list of specific, tangible requirements (rooms, meals, equipment) like 'main stage', '2 breakout rooms', 'networking lunch', 'projector', 'spa access', or '40 hotel rooms'. Do NOT extract abstract concepts like 'tracks' or 'sessions'."),

});

export type ExtractedRequirements = z.infer<typeof ExtractedRequirementsSchema>;

// The contract for a single step in the agent's plan.
// We use discriminatedUnion for maximum type safety and clear instructions to the LLM.
export const ProposalPlanStepSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('add_product').describe("Use this to add a specific product from the provided catalog."),
    productId: z.number().describe("The numeric ID of the product from the catalog."),
    variationId: z.number().describe("The numeric variation ID of the product from the catalog."),
    productName: z.string().describe("The name of the product (for reference in the UI)."),
    quantity: z.number().default(1).describe("The quantity needed. Use 1 for flat fees (e.g., room rental), or the guest count for per-person items (e.g., lunch)."),
    justification: z.string().describe("Internal reasoning: Why was this specific product chosen based on the RFP?"),
  }).describe("Action: Add a catalog product to the proposal."),
  
  z.object({
    type: z.literal('add_custom_text').describe("Use this to add customized text, like a warm welcome or specific event details not covered by products."),
    title: z.string().describe("The heading for the text block (e.g., 'Welcome to your Board Meeting')."),
    body: z.string().describe("The beautifully written body text to be displayed to the customer."),
  }).describe("Action: Add a custom text block to the proposal."),
]).describe("A single step or block in the proposal plan.");

// The contract for the entire plan, which is a sequence of steps.
export const ProposalPlanSchema = z.object({
  title: z.string().describe("A professional, catchy title for the entire proposal (e.g., 'Quarterly Board Meeting at Grand Hotel')."),
  proposedDates: z.object({
     start: z.string().optional().describe("The proposed start date (ISO 8601). Leave blank if impossible to determine."),
     end: z.string().optional().describe("The proposed end date (ISO 8601). Leave blank if impossible to determine.")
  }).describe("The finalized dates for the proposal based on the RFP."),
  steps: z.array(ProposalPlanStepSchema).describe("The sequence of blocks that make up the proposal. Order matters. Start with a custom text welcome, then add products logically."),
}).describe("The complete, step-by-step plan for generating the proposal.");

export type ProposalPlan = z.infer<typeof ProposalPlanSchema>;
export type ProposalPlanStep = z.infer<typeof ProposalPlanStepSchema>;