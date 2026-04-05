import express, { Request, Response, NextFunction } from 'express';
import 'dotenv/config';
import { handleAgentRequest } from './features/proposal-agent/proposal-agent.controller';
import { BaseError } from './core/errors';
import { VectorStore } from './core/vector-store';
import fs from 'fs';
import path from 'path';

// Create a global, shared instance of our VectorStore
export const vectorStore = new VectorStore();

// --- Cold Start Logic ---
// Load our pre-built index from file when the server starts.
// This makes our retrieval service immediately ready without API calls.
try {
  // Use process.cwd() to ensure Vercel finds the file in the project root
  const filePath = path.join(process.cwd(), 'vector-store.json');
  const savedIndexRaw = fs.readFileSync(filePath, 'utf-8');
  const savedIndex = JSON.parse(savedIndexRaw);
  vectorStore.loadIndex(savedIndex);
} catch (error: any) {
  if (error.code === 'ENOENT') {
    console.warn('⚠️ vector-store.json not found. Retrieval service will not work.');
    console.warn('   Run "npm run db:ingest" to create the index.');
  } else {
    console.error('💥 Failed to load vector-store.json:', error);
  }
}

const app = express();
const port = process.env.PORT || 3000;

// === DEPENDENCY INJECTION ===
// We attach our global, loaded VectorStore to the Express application locals.
// This allows any controller to access it without relying on a global import,
// which is a much cleaner, more testable architectural pattern.
app.locals.vectorStore = vectorStore;

// === MIDDLEWARE ===
// Parses incoming JSON requests
app.use(express.json());
// Serves our interactive demo from the 'public' folder
app.use(express.static('public'));


// === ROUTES ===
// A simple health check to see if the server is alive
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// This is the highway: All requests to /api/agent are routed to our controller
app.post('/api/agent', handleAgentRequest);


// === CENTRAL ERROR HANDLER ===
// This is our safety net. All errors thrown and passed along with 'next(error)'
// end up here. This ensures we always send a nice,
// formatted error to the client instead of crashing.
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('💥 An error occurred:', err);

  if (err instanceof BaseError && err.isOperational) {
    return res.status(err.statusCode).json({
      error: {
        name: err.name,
        message: err.message,
      },
    });
  }

  // For unexpected, non-operational errors
  res.status(500).json({
    error: {
      name: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred on the server.',
    },
  });
});


// === SERVER START ===
// Only start the server if the file is run directly (not imported by tests)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);
  });
}

// Export the app so our tests (Supertest) can use it
export default app;