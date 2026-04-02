import { z } from 'zod';

export interface TaskInput {
  customerName: string;
  requestDetails: string;
}

export const ProposalSchema = z.object({
  title: z.string(),
  description: z.string(),
  price: z.number(),
});

export type Proposal = z.infer<typeof ProposalSchema>;
