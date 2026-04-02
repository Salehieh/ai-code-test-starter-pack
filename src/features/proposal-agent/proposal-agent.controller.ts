import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
// Vi skapar ett enkelt schema här för RFP-inputen, kan flyttas till schemas.ts senare.
const RfpInputSchema = z.object({
  rfpText: z.string().min(20),
});
import { ValidationError } from '../../core/errors';
import { generateProposalForCustomer } from './proposal-agent.service';

export async function handleAgentRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const validationResult = RfpInputSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(validationResult.error.message);
    }
    const { rfpText } = validationResult.data;

    // Anpassa anropet till servicen när den är redo att ta emot texten.
    // const result = await generateProposalForCustomer(rfpText);
    
    // Temporärt svar
    res.status(200).json({ message: "Endpoint is wired up correctly.", receivedRfp: rfpText });

  } catch (error) {
    next(error);
  }
}
