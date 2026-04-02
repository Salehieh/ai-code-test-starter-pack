import 'dotenv/config';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Creates an embedding (vector representation) for a given text string.
 * Uses OpenAI's API and handles errors.
 * @param text The text to be converted into an embedding.
 * @returns A promise that resolves to an array of numbers (the vector).
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
