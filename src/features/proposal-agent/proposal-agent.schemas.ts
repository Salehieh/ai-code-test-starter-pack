import { z } from 'zod';

// Detta är den nya, mer förlåtande versionen av vårt schema.
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
    max: z.number().optional().describe("The maximum or approximate budget amount."),
    currency: z.string().default('EUR'),
    description: z.string().optional().describe("Original budget text with nuances, e.g., 'around 2000' or 'excluding accommodation'."),
  }).optional().describe("The customer's budget. Omit if not mentioned."),

  specialRequests: z.array(z.string()).optional().describe("A list of specific requirements like 'projector', 'spa access', or '40 hotel rooms'."),

});

export type ExtractedRequirements = z.infer<typeof ExtractedRequirementsSchema>;

// ... (resten av filen kan vara kvar som den är)
export const ProposalPlanStepSchema = z.object({});
export const ProposalPlanSchema = z.array(ProposalPlanStepSchema);
export type ProposalPlan = z.infer<typeof ProposalPlanSchema>;