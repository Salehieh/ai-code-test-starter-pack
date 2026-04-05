import 'dotenv/config';
import fs from 'fs/promises';
import { ProposalesClient } from '../src/core/proposales-client/proposales-client';
import { VectorStore } from '../src/core/vector-store';

// The path where we save our pre-built index
const VECTORS_FILE_PATH = './vector-store.json';

// Read the critical configuration
const apiKey = process.env.PROPOSALES_API_KEY;
if (!apiKey) {
  throw new Error('FATAL: PROPOSALES_API_KEY must be set in your .env file.');
}

async function runIngestion() {
  console.log('--- Starting Ingestion Pipeline ---');

  // Step 1: Fetch raw data from the API
  console.log('1. Fetching products from Proposales API...');
  const apiClient = new ProposalesClient(apiKey);
  const products = await apiClient.getProducts();
  console.log(`   - Received ${products.length} products.`);

  // Step 2: Process and create embeddings
  console.log('2. Creating embeddings and building vector index (this might take a while)...');
  const vectorStore = new VectorStore();
  await vectorStore.ingest(products);
  
  // We cannot directly save a class with methods, so we extract the serializable index.
  // We added a small helper method in VectorStore for this.
  const serializableIndex = vectorStore.getIndex();
  
  // Step 3: Save the completed index to a file
  console.log(`3. Saving the serializable index to ${VECTORS_FILE_PATH}...`);
  await fs.writeFile(VECTORS_FILE_PATH, JSON.stringify(serializableIndex, null, 2));
  
  console.log('--- ✅ Ingestion Pipeline Completed ---');
}

runIngestion().catch(error => {
  console.error("💥 A critical error occurred during ingestion:", error);
  process.exit(1);
});
