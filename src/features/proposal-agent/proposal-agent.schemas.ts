import { z } from 'zod';

// Kontraktet för den strukturerade information vi extraherar från en ostrukturerad RFP.
export const ExtractedRequirementsSchema = z.object({
  eventType: z.string().describe("Typen av event, t.ex. 'board meeting', 'product launch', 'wedding'"),
  guestCount: z.number().positive().describe("Antalet gäster"),
  dates: z.object({
    start: z.string().datetime().describe("Startdatum och tid i ISO 8601-format"),
    end: z.string().datetime().describe("Slutdatum och tid i ISO 8601-format"),
  }).describe("Eventets datum"),
  budget: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().default('EUR'),
  }).describe("Kundens budget"),
  specialRequests: z.array(z.string()).describe("En lista över specifika önskemål, t.ex. 'projector', 'dietary accommodations'"),
});

// Kontraktet för ett enskilt steg i agentens plan.
// Vi använder discriminatedUnion för maximal typsäkerhet.
export const ProposalPlanStepSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('add_product'),
    productId: z.string().describe("ID för produkten från hotellets innehållsbibliotek"),
    justification: z.string().describe("Varför denna produkt valdes baserat på RFP:n"),
  }),
  z.object({
    type: z.literal('add_custom_text'),
    title: z.string().describe("Rubriken för textblocket"),
    body: z.string().describe("Brödtexten som ska skrivas, t.ex. en välkomsthälsning"),
  }),
]);

// Kontraktet för hela planen, som är en sekvens av steg.
export const ProposalPlanSchema = z.array(ProposalPlanStepSchema);

// Kontraktet för resultatet av vår kvalitetsutvärdering.
export const EvaluationResultSchema = z.object({
  completeness: z.object({
    score: z.number().min(1).max(5),
    reasoning: z.string(),
  }).describe("Hur väl alla delar av RFP:n har adresserats."),
  relevance: z.object({
    score: z.number().min(1).max(5),
    reasoning: z.string(),
  }).describe("Hur relevanta de valda produkterna är."),
  professionalism: z.object({
    score: z.number().min(1).max(5),
    reasoning: z.string(),
  }).describe("Kvaliteten på den genererade texten och tonen."),
});

// Vi exporterar även TypeScript-typerna för enkel användning i vår kod.
export type ExtractedRequirements = z.infer<typeof ExtractedRequirementsSchema>;
export type ProposalPlan = z.infer<typeof ProposalPlanSchema>;
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;
