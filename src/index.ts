import express, { Request, Response } from 'express';
import dotenv from 'dotenv';

// Ladda in miljövariabler från .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware för att kunna ta emot JSON
app.use(express.json());

// Servera statiska filer från 'public'-mappen (Vår interaktiva demo!)
app.use(express.static('public'));

// Vår "glödlampa" - Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Starta bara servern om filen körs direkt (inte om den importeras av våra tester)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
  });
}

// Vi exporterar appen så att Supertest kan använda den i nästa steg
export default app;
