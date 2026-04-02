import express, { Request, Response, NextFunction } from 'express';
import 'dotenv/config';
import { handleAgentRequest } from './features/proposal-agent/proposal-agent.controller';
import { BaseError } from './core/errors';

const app = express();
const port = process.env.PORT || 3000;

// === MIDDLEWARE ===
// Tolkar inkommande JSON-anrop
app.use(express.json());
// Servar vår interaktiva demo från 'public'-mappen
app.use(express.static('public'));


// === ROUTES ===
// En enkel "health check" för att se att servern lever
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Här är motorvägen: Alla anrop till /api/agent skickas till vår controller
app.post('/api/agent', handleAgentRequest);


// === CENTRAL FELHANTERARE ===
// Detta är vårt säkerhetsnät. Alla fel som kastas och skickas vidare med 'next(error)'
// hamnar här. Detta säkerställer att vi alltid skickar ett snyggt,
// formaterat fel till klienten istället för att krascha.
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('💥 Ett fel inträffade:', err);

  if (err instanceof BaseError && err.isOperational) {
    return res.status(err.statusCode).json({
      error: {
        name: err.name,
        message: err.message,
      },
    });
  }

  // För oväntade, icke-operationella fel
  res.status(500).json({
    error: {
      name: 'INTERNAL_SERVER_ERROR',
      message: 'Ett oväntat fel inträffade på servern.',
    },
  });
});


// === SERVER START ===
// Starta bara servern om filen körs direkt (inte importeras av tester)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`🚀 Servern är igång på http://localhost:${port}`);
  });
}

// Exportera appen för att våra tester (Supertest) ska kunna använda den
export default app;