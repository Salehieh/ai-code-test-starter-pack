import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../../core/errors';
import { ProposalAgentService } from './proposal-agent.service'; // Import our new service
import { VectorStore } from '../../core/vector-store';

const RfpInputSchema = z.object({
  rfpText: z.string().min(20, "RFP text must be at least 20 characters."),
});

export async function handleAgentRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const validationResult = RfpInputSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(validationResult.error.message);
    }
    const { rfpText } = validationResult.data;

    // Dependency Injection: Get the loaded VectorStore from Express locals
    const vectorStore = req.app.locals.vectorStore as VectorStore;
    if (!vectorStore) {
        throw new Error("Critical Server Error: VectorStore is not initialized.");
    }

    // Call the first step in our agent pipeline
    console.log('\n--- 🤖 Agent Pipeline Initiated ---');
    console.log('▶️ Starting "Extract" step...');
    const extractedRequirements = await ProposalAgentService.extractRequirements(rfpText);
    console.log('✅ "Extract" step completed.');

    // === STEP 2: RETRIEVE ===
    console.log('▶️ Starting "Retrieve" step...');
    const retrievedProducts = await ProposalAgentService.retrieveProducts(extractedRequirements, vectorStore);
    console.log('✅ "Retrieve" step completed.');

    // === STEP 3: PLAN ===
    console.log('▶️ Starting "Plan" step...');
    const proposalPlan = await ProposalAgentService.generateProposalPlan(
      rfpText,
      extractedRequirements,
      retrievedProducts
    );
    console.log('✅ "Plan" step completed.');

    console.log('--- 🏁 Agent Pipeline Finished ---');

    // Return the full plan to verify it works.
    res.status(200).json({
      message: "Pipeline completed through step 3!",
      data: {
        extractedRequirements,
        curatedCatalog: retrievedProducts,
        proposalPlan
      },
    });

  } catch (error) {
    next(error);
  }
}
