import { z } from 'zod';

// The strict contract for our AI Judge.
// Notice that 'reasoning' is first to enforce Chain-of-Thought prompting.
export const EvaluationScorecardSchema = z.object({
  reasoning: z.string().describe("A detailed explanation of why the proposal received this score based on the original requirements."),
  missedRequirements: z.array(z.string()).describe("A list of explicit requests from the RFP that are missing from the proposal plan. Empty array if none."),
  toneScore: z.number().describe("Score from 0-100 on the professionalism and warmth of the custom text blocks."),
  accuracyScore: z.number().describe("Score from 0-100 on how accurately the chosen products match the client's requested event type, guest count, and dates."),
  finalScore: z.number().describe("The overall weighted score (0-100). Deduct heavily for missing requirements."),
  isApproved: z.boolean().describe("True ONLY IF finalScore is >= 80 AND missedRequirements is empty. Otherwise false."),
}).describe("The final grading scorecard for the generated proposal.");

export type EvaluationScorecard = z.infer<typeof EvaluationScorecardSchema>;