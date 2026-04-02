import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
// We create a simple schema here for the RFP input, can be moved to schemas.ts later.
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

    // Adapt the call to the service when it's ready to receive the text.
    // const result = await generateProposalForCustomer(rfpText);
    
    // Temporary response
    res.status(200).json({ message: "Endpoint is wired up correctly.", receivedRfp: rfpText });

  } catch (error) {
    next(error);
  }
}