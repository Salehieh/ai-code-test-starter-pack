import { Request, Response, NextFunction } from 'express';
import { TaskInputSchema } from '../types'; // Exempel-schema
import { ValidationError } from '../core/errors';
import { generateProposalForCustomer } from '../services/agent.service'; // Importera servicen

export async function handleAgentRequest(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Validera inkommande data mot vårt Zod-schema
    const validationResult = TaskInputSchema.safeParse(req.body);
    if (!validationResult.success) {
      // Om validering misslyckas, kasta ett specifikt valideringsfel
      throw new ValidationError(validationResult.error.message);
    }
    const validatedInput = validationResult.data;

    // 2. Anropa service-lagret med den rena, validerade datan
    const result = await generateProposalForCustomer(validatedInput);

    // 3. Skicka ett framgångsrikt svar till klienten
    res.status(200).json(result);

  } catch (error) {
    // 4. Skicka ALLA fel (ValidationError, ExternalServiceError, etc.)
    // vidare till en centraliserad felhanterings-middleware.
    next(error);
  }
}