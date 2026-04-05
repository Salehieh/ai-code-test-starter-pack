import { ProposalesProduct } from './proposales-client/proposales-client.schemas';
import { createEmbedding } from './llm-utils';
import { cosineSimilarity } from './cosine-similarity';

// Defines the structure for an object in our index
type VectorStoreIndexItem = {
  product: ProposalesProduct;
  embedding: number[];
};

/**
 * A simple, in-memory Vector Store for semantic search.
 * Handles ingestion, indexing, and searching of products.
 */
export class VectorStore {
  private index: VectorStoreIndexItem[] = [];

  /**
   * A private method to create an embedding.
   * This encapsulates the call to llm-utils.
   */
  private async _embed(text: string): Promise<number[]> {
    return createEmbedding(text);
  }

  /**
   * Takes a list of products, creates embeddings for them,
   * and builds the searchable index.
   * @param products An array of products from the Proposales API.
   */
  public async ingest(products: ProposalesProduct[]): Promise<void> {
    console.log(`🧠 Starting ingestion of ${products.length} products...`);
    this.index = []; // Clear existing index

    for (const product of products) {
      // Create a meaningful text string for embedding
      const textToEmbed = `Product: ${product.title.en}\nDescription: ${product.description?.en || 'No description available'}`;
      
      const embedding = await this._embed(textToEmbed);
      
      this.index.push({
        product,
        embedding,
      });
    }
    console.log(`✅ Ingestion completed. The index now contains ${this.index.length} items.`);
  }

  /**
   * Searches the index for the most relevant products based on a text query.
   * @param query The search query (e.g., a part of an RFP).
   * @param topK The number of results to return.
   * @returns An array of the most relevant products.
   */
  public async search(query: string, topK: number = 5): Promise<ProposalesProduct[]> {
    if (this.index.length === 0) {
      console.warn('Search performed against an empty index.');
      return [];
    }
    
    console.log(`🔍 Searching for "${query}"...`);
    const queryEmbedding = await this._embed(query);

    const scoredItems = this.index.map(item => ({
      product: item.product,
      score: cosineSimilarity(queryEmbedding, item.embedding),
    }));

    // Sort by highest score (greatest similarity)
    scoredItems.sort((a, b) => b.score - a.score);

    // Return the top K best products
    return scoredItems.slice(0, topK).map(item => item.product);
  }

  /**
   * Returns the internal, serializable index.
   * Used by the ingest script to save the index to a file.
   */
  public getIndex(): VectorStoreIndexItem[] {
    return this.index;
  }

  /**
   * Loads a pre-built, serializable index into memory.
   * Used by the server at startup for a fast "cold start".
   * @param savedIndex The index read from vector-store.json.
   */
  public loadIndex(savedIndex: VectorStoreIndexItem[]): void {
    console.log(`⚡️ Loading pre-built index with ${savedIndex.length} items into memory...`);
    this.index = savedIndex;
    console.log('✅ Index loaded and ready.');
  }
}
