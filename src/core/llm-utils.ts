import 'dotenv/config';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Skapar en embedding (vektorrepresentation) för en given textsträng.
 */
export async function createEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // Cost-effective and high-performing model
      input: text.replace(/\n/g, ' '), // The API doesn't like newlines
    });

    if (!response.data[0]?.embedding) {
      throw new Error('No embedding returned from OpenAI API.');
    }
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error calling OpenAI Embeddings API:', error);
    throw new Error('Failed to create embedding.');
  }
}

/**
 * Anropar OpenAI API med ett Zod-schema definierat som ett "Tool",
 * vilket tvingar modellen att svara med JSON som matchar schemat.
 */
type JsonSchemaObject = { [key: string]: any };

export async function getStructuredResponse<T extends z.ZodTypeAny>(
  systemPrompt: string,
  userPrompt: string,
  schema: T,
  jsonSchemaOverride?: Record<string, any>
): Promise<z.infer<T>> {
  try {
    let parameters: Record<string, any>;

    if (jsonSchemaOverride) {
        parameters = jsonSchemaOverride;
    } else {
        const jsonSchema = zodToJsonSchema(schema as any, "response_schema");
        parameters = jsonSchema.definitions?.response_schema || jsonSchema;
    }

    if (!parameters || parameters.type !== 'object') {
      throw new Error("Kunde inte generera en giltig schema-definition (måste vara typen 'object').");
    }

    const requestPayload = {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'format_response',
          description: 'Formats the response according to the provided JSON schema. You MUST use this tool.',
          parameters: parameters as Record<string, any>,
        },
      }],
      tool_choice: {
        type: 'function',
        function: { name: 'format_response' },
      },
    };

    const response = await openai.chat.completions.create(requestPayload as any);
    const message = response.choices[0].message;

    if (!message.tool_calls) {
      throw new Error("Modellen misslyckades med att anropa det nödvändiga verktyget.");
    }

    const toolCall = message.tool_calls[0];

    if (toolCall.type !== 'function') {
        throw new Error(`Förväntade ett 'function' tool call, men fick '${toolCall.type}'.`);
    }

    const rawJson = toolCall.function.arguments;
    
    let parsed;
    try {
      parsed = JSON.parse(rawJson);
    } catch (parseError) {
       console.error('❌ Failed to parse JSON from LLM:', rawJson);
       throw new Error("Kunde inte parsa LLM-svaret som JSON.");
    }

    return schema.parse(parsed);

  } catch (error: any) {
    console.error("❌ Error in getStructuredResponse:");
    if (error && typeof error === 'object' && 'issues' in error) {
       console.error('Zod Validation Error details:', JSON.stringify(error.issues, null, 2));
    } else if (error instanceof OpenAI.APIError) {
      console.error('OpenAI API Error Details:', error.error);
    } else {
       console.error(error);
    }
    throw new Error("Failed to get a validated, structured response from LLM.");
  }
}