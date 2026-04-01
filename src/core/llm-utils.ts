import OpenAI, { OpenAIError } from 'openai';
import { z } from 'zod';
import { ExternalServiceError } from './errors';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * En robust, återanvändbar funktion för att anropa OpenAI och garantera
 * att svaret matchar ett specifikt Zod-schema.
 * Detta är kärnan i vår "Intentional Robustness"-filosofi.
 *
 * @param systemPrompt Den övergripande instruktionen och rollen för AI:n.
 * @param userPrompt Den specifika uppgiften eller användarfrågan.
 * @param schema Zod-schemat som AI:ns JSON-svar måste valideras mot.
 * @returns Ett löfte som löses med den validerade datan, strikt typad enligt schemat.
 * @throws {ExternalServiceError} Om anropet till OpenAI misslyckas eller om svaret inte kan valideras.
 */
export async function getStructuredResponse<T extends z.ZodTypeAny>(
  systemPrompt: string,
  userPrompt: string,
  schema: T
): Promise<z.infer<T>> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;

    if (!content) {
      throw new ExternalServiceError('INVALID_AI_RESPONSE', 'AI-svaret var tomt.');
    }

    // Isolerat försök att parsa och validera innehållet
    try {
      const jsonResponse = JSON.parse(content);
      const validatedData = schema.parse(jsonResponse);
      return validatedData;
    } catch (validationError) {
      console.error('Valideringsfel av AI-svar:', validationError);
      throw new ExternalServiceError('INVALID_AI_RESPONSE', 'AI-svaret hade ett ogiltigt format.');
    }

  } catch (error) {
    if (error instanceof OpenAIError) {
      console.error('OpenAI API Error:', error.message);
      throw new ExternalServiceError('OPENAI_FAILURE', 'Kunde inte kommunicera med AI-tjänsten.');
    }
    // Om felet redan är ett av våra hanterade fel, skicka det vidare
    if (error instanceof ExternalServiceError) {
      throw error;
    }
    // För alla andra oväntade fel
    console.error('Oväntat fel i getStructuredResponse:', error);
    throw new ExternalServiceError('UNEXPECTED_ERROR', 'Ett oväntat internt fel inträffade.');
  }
}