import { ProposalAgentService } from './proposal-agent.service';
import { ProposalPlan } from './proposal-agent.schemas';

// --- Phase 1: Infrastructure Setup ---
// We mock the non-deterministic LLM and external dependencies to ensure our tests are 100% deterministic.
// This enforces our "Test the cage, not the dragon" philosophy.
jest.mock('../../core/llm-utils');
jest.mock('../../core/vector-store');
jest.mock('../../core/proposales-client/proposales-client');

describe('ProposalAgentService - Deterministic Assembly', () => {
  const COMPANY_ID = 12345;

  describe('assembleProposal()', () => {
    it('should correctly map a complete ProposalPlan to a Proposales API payload', () => {
      // Arrange: Create a mock plan with both text and product steps
      const mockPlan: ProposalPlan = {
        title: 'Quarterly Board Meeting',
        proposedDates: {
          start: '2024-05-15',
          end: '2024-05-16'
        },
        steps: [
          {
            type: 'add_custom_text',
            title: 'Welcome',
            body: 'Thank you for choosing Grand Hotel.'
          },
          {
            type: 'add_product',
            productId: 100,
            variationId: 101, // The API requires variationId as content_id
            productName: 'Meeting Room A',
            quantity: 1,
            justification: 'Perfect for 12 attendees.'
          }
        ]
      };

      // Act: Run the deterministic assembly function
      const payload = ProposalAgentService.assembleProposal(mockPlan, COMPANY_ID);

      // Assert: Verify the top-level payload structure
      expect(payload.company_id).toBe(COMPANY_ID);
      expect(payload.language).toBe('en');
      expect(payload.title_md).toBe('Quarterly Board Meeting');
      
      // Assert: Verify Markdown generation (Dates and Custom Text)
      expect(payload.description_md).toContain('**Proposed Dates:** 2024-05-15 to 2024-05-16');
      expect(payload.description_md).toContain('# Welcome');
      expect(payload.description_md).toContain('Thank you for choosing Grand Hotel.');

      // Assert: Verify Blocks mapping (Crucial API contract)
      expect(payload.blocks).toBeDefined();
      expect(payload.blocks).toHaveLength(1);
      expect(payload.blocks![0]).toEqual({
        content_id: 101, // Proves we map variationId correctly
        type: 'product-block',
        quantity: 1
      });
    });

    it('should handle plans without proposed dates gracefully', () => {
      // Arrange: A plan where dates could not be determined
      const mockPlan: ProposalPlan = {
        title: 'Flexible Event',
        proposedDates: {}, // The object is required by schema, but fields are optional
        steps: [
          {
            type: 'add_custom_text',
            title: 'Intro',
            body: 'Dates TBD.'
          }
        ]
      };

      // Act
      const payload = ProposalAgentService.assembleProposal(mockPlan, COMPANY_ID);

      // Assert: Ensure no 'undefined' strings leak into the markdown
      expect(payload.description_md).not.toContain('undefined');
      expect(payload.description_md).toContain('# Intro');
      expect(payload.description_md).toContain('Dates TBD.');
      expect(payload.blocks).toHaveLength(0);
    });
  });

  describe('Orchestration & Error Handling (The Cage)', () => {
    const { getStructuredResponse } = require('../../core/llm-utils');
    const mockGetStructuredResponse = getStructuredResponse as jest.MockedFunction<typeof getStructuredResponse>;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should propagate errors if LLM extraction fails (e.g., Zod validation error)', async () => {
      // Arrange: Simulate the LLM returning garbage that fails Zod parsing
      const errorMessage = 'Zod validation failed: missing required field';
      mockGetStructuredResponse.mockRejectedValueOnce(new Error(errorMessage));

      // Act & Assert: The service should fail fast and throw the error to the controller
      await expect(ProposalAgentService.extractRequirements('Some RFP text'))
        .rejects
        .toThrow(errorMessage);
    });

    it('should deduplicate products retrieved from multiple parallel vector searches', async () => {
      // Arrange: Create a mock VectorStore
      const mockVectorStore = {
        search: jest.fn()
      };

      // Simulate a search where the base query, special request, and catch-all return overlapping results
      // All return product_id: 10
      mockVectorStore.search
        .mockResolvedValueOnce([{ product_id: 10, title: { en: 'Main Room' } }]) // Base query result
        .mockResolvedValueOnce([
          { product_id: 10, title: { en: 'Main Room' } }, // Overlap!
          { product_id: 20, title: { en: 'Projector' } }
        ]) // Special request result
        .mockResolvedValueOnce([{ product_id: 20, title: { en: 'Projector' } }]); // Catch-all result

      const mockRequirements = {
        eventType: 'Conference',
        specialRequests: ['Need a projector']
      };

      // Act
      const results = await ProposalAgentService.retrieveProducts(mockRequirements as any, mockVectorStore as any);

      // Assert: We should only get 2 unique products back, not 3
      expect(results).toHaveLength(2);
      const productIds = results.map(r => r.product_id);
      expect(productIds).toContain(10);
      expect(productIds).toContain(20);
      
      // Verify parallel execution (search was called twice)
      expect(mockVectorStore.search).toHaveBeenCalledTimes(2);
    });
  });
});
