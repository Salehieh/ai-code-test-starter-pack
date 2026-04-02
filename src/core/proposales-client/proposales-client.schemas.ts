import { z } from 'zod';

// DEN NYA, KORREKTA SANNINGEN för ett produkt-objekt
export const ProposalesProductSchema = z.object({
  product_id: z.number(),
  variation_id: z.number(),
  title: z.object({
    en: z.string(), // Vi förväntar oss ett objekt med en 'en'-nyckel
  }),
  description: z.object({
    en: z.string(),
  }).nullable(), // Hela objektet kan vara null
  // Vi lägger till de andra fälten som kan vara användbara
  created_at: z.number(),
  deactivated_at: z.number().nullable(),
}).passthrough(); // passthrough() ignorerar fält vi inte definierat

// Hela responsen från GET /v3/content
export const GetProductsResponseSchema = z.object({
    data: z.array(ProposalesProductSchema)
});

// --- Dessa scheman är fortfarande korrekta för att SKAPA en produkt ---
export const CreateProductPayloadSchema = z.object({
  company_id: z.number(),
  language: z.string().default('en'),
  title: z.string().min(3),
  description: z.string().optional(),
});

export const CreateProductResponseSchema = z.object({
  data: z.object({
    product_id: z.number(),
    variation_id: z.number(),
    message: z.string(),
  }),
});

// --- Härledda typer ---
export type ProposalesProduct = z.infer<typeof ProposalesProductSchema>;
export type CreateProductPayload = z.infer<typeof CreateProductPayloadSchema>;