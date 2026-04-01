import { z } from 'zod';

// Detta är hjärtat av vår robusthet. Här definierar vi alla
// datakontrakt med Zod.

// Exempel på ett schema för en inkommande API-request.
export const TaskInputSchema = z.object({
  customerName: z.string().min(2, "Kundnamn måste vara minst 2 tecken."),
  requestDetails: z.string().min(10, "Detaljer måste vara minst 10 tecken."),
});

// Exempel på ett schema för AI:ns förväntade svar.
export const ProposalSchema = z.object({
  title: z.string().describe("En säljande rubrik för offerten"),
  body: z.string().describe("En personlig och inbjudande text"),
  price: z.number().describe("Det totala priset")
});

// Härifrån kan vi inferera TypeScript-typer för fullständig typsäkerhet.
export type TaskInput = z.infer<typeof TaskInputSchema>;
export type Proposal = z.infer<typeof ProposalSchema>;