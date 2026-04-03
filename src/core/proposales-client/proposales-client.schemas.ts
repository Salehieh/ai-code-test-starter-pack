import { z } from 'zod';

// THE NEW, CORRECT SOURCE OF TRUTH for a product object
export const ProposalesProductSchema = z.object({
  product_id: z.number(),
  variation_id: z.number(),
  title: z.object({
    en: z.string(), // We expect an object with an 'en' key
  }),
  description: z.object({
    en: z.string(),
  }).nullable(), // The entire object can be null
  // We add the other fields that might be useful
  created_at: z.number(),
  deactivated_at: z.number().nullable(),
}).passthrough(); // passthrough() ignores fields we haven't defined

// The entire response from GET /v3/content
export const GetProductsResponseSchema = z.object({
    data: z.array(ProposalesProductSchema)
});

// --- These schemas are still correct for CREATING a product ---
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

// --- Derived types ---
export type ProposalesProduct = z.infer<typeof ProposalesProductSchema>;
export type CreateProductPayload = z.infer<typeof CreateProductPayloadSchema>;

// --- Schemas for CREATING a Proposal (Step 4) ---
export const CreateProposalPayloadSchema = z.object({
  company_id: z.number(),
  language: z.string().default('en'),
  title_md: z.string().optional(),
  description_md: z.string().optional(),
  blocks: z.array(z.object({
    content_id: z.number(),
    type: z.literal('product-block').optional(),
    quantity: z.number().optional() // Passed as additional block data
  }).passthrough()).optional()
});

export const CreateProposalResponseSchema = z.object({
  proposal: z.object({
    uuid: z.string(),
    url: z.string()
  })
});

export type CreateProposalPayload = z.infer<typeof CreateProposalPayloadSchema>;