import { getStructuredResponse } from '../core/llm-utils';
import { TaskInput, ProposalSchema, Proposal } from '../types'; // Exempel-typer

/**
 * Detta är vår rena kärnlogik, helt isolerad från API-ramverk.
 * Denna funktion är lätt att enhetstesta genom att mocka getStructuredResponse.
 */
export async function generateProposalForCustomer(input: TaskInput): Promise<Proposal> {
  
  // 1. Definiera roll och uppgift för AI:n
  const systemPrompt = "Du är en expert på att skriva säljande offerter för premium-event. Ditt språk är professionellt och inbjudande. Du svarar ALLTID med ett JSON-objekt som följer den specificerade strukturen.";
  const userPrompt = `Skapa en offert baserad på följande kunddata:
    Företag: ${input.customerName}
    Önskemål: ${input.requestDetails}`;

  // 2. Anropa vår robusta LLM-funktion med det förväntade svars-schemat
  const proposal = await getStructuredResponse(
    systemPrompt,
    userPrompt,
    ProposalSchema // Detta är datakontraktet AI:n måste följa
  );

  // 3. (Valfritt) Gör ytterligare ren affärslogik här, t.ex. beräkningar.
  // const finalPrice = proposal.price * 1.25;

  return proposal;
}