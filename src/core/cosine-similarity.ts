/**
 * Calculates the cosine similarity between two vectors (embeddings).
 * The result is a value between -1 and 1, where 1 means identical,
 * 0 means no similarity (orthogonal), and -1 means opposite.
 * @param vecA The first vector.
 * @param vecB The second vector.
 * @returns A number representing the similarity.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same dimension.');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0; // To avoid division by zero
  }

  return dotProduct / (magnitudeA * magnitudeB);
}
