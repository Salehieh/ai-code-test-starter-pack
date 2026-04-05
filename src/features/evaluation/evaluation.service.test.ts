import { EvaluationService } from './evaluation.service';
import { ExtractedRequirements, ProposalPlan } from '../proposal-agent/proposal-agent.schemas';
import { getStructuredResponse } from '../../core/llm-utils';

// --- Phase 1: Infrastructure Setup ---
// We mock the non-deterministic LLM to test our deterministic guardrails (Heuristics).
// This ensures we can force the LLM to "hallucinate" or return perfect scores on demand.
jest.mock('../../core/llm-utils');

const mockGetStructuredResponse = getStructuredResponse as jest.MockedFunction<typeof getStructuredResponse>;

describe('EvaluationService - Quality Assurance Guardrails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Heuristic Checks (Deterministic Overrides)', () => {
    it('should override a perfect LLM score if the plan is missing required dates', async () => {
      // Arrange: The LLM is acting "lenient" and giving a perfect score despite missing dates
      mockGetStructuredResponse.mockResolvedValueOnce({
        reasoning: "The plan looks great, I ignored the missing dates.",
        missedRequirements: [],
        toneScore: 100,
        accuracyScore: 100,
        finalScore: 100,
        isApproved: true
      });

      // Arrange: The RFP explicitly requested a start date
      const mockRequirements: ExtractedRequirements = {
        eventType: 'Conference',
        dates: { start: '2024-10-10', description: 'Oct 10th' }
      };

      // Arrange: The AI Agent failed to include the dates in the plan
      const mockPlan: ProposalPlan = {
        title: 'Conference Proposal',
        proposedDates: {}, // Missing start date
        steps: [{ type: 'add_custom_text', title: 'Intro', body: 'Hello' }]
      };

      // Act: Run the evaluation
      const scorecard = await EvaluationService.evaluateProposal('Raw RFP Text', mockRequirements, mockPlan);

      // Assert: Our deterministic heuristics must catch the error and override the LLM
      expect(scorecard.finalScore).toBeLessThanOrEqual(40); // Severely capped
      expect(scorecard.isApproved).toBe(false); // Must be rejected
      expect(scorecard.missedRequirements).toContain(
        "CRITICAL ERROR: Original RFP specified a start date, but the generated plan omitted it."
      );
    });

    it('should override a perfect LLM score if the plan has 0 product quantity but guests were requested', async () => {
      // Arrange: LLM gives a perfect score
      mockGetStructuredResponse.mockResolvedValueOnce({
        reasoning: "Looks fine to me.",
        missedRequirements: [],
        toneScore: 100,
        accuracyScore: 100,
        finalScore: 100,
        isApproved: true
      });

      // Arrange: RFP requested 50 guests
      const mockRequirements: ExtractedRequirements = {
        eventType: 'Dinner',
        guestCount: { primary: 50 }
      };

      // Arrange: Plan has products, but total quantity is 0
      const mockPlan: ProposalPlan = {
        title: 'Dinner Proposal',
        proposedDates: { start: '2024-10-10' },
        steps: [
          {
            type: 'add_product',
            productId: 1,
            variationId: 2,
            productName: 'Room',
            quantity: 0, // ERROR: Quantity is 0
            justification: 'Added room'
          }
        ]
      };

      // Act
      const scorecard = await EvaluationService.evaluateProposal('Raw RFP Text', mockRequirements, mockPlan);

      // Assert: Heuristics catch the quantity mismatch
      expect(scorecard.finalScore).toBeLessThanOrEqual(40);
      expect(scorecard.isApproved).toBe(false);
      expect(scorecard.missedRequirements).toContain(
        "CRITICAL ERROR: RFP requested attendees, but no products with a quantity > 0 were added."
      );
    });

    it('should pass a perfect plan and preserve the LLM score', async () => {
      // Arrange: LLM gives a perfect score
      mockGetStructuredResponse.mockResolvedValueOnce({
        reasoning: "Flawless execution.",
        missedRequirements: [],
        toneScore: 100,
        accuracyScore: 100,
        finalScore: 100,
        isApproved: true
      });

      // Arrange: Requirements match the plan perfectly
      const mockRequirements: ExtractedRequirements = {
        eventType: 'Dinner',
        dates: { start: '2024-10-10', description: 'Oct 10th' },
        guestCount: { primary: 50 }
      };

      const mockPlan: ProposalPlan = {
        title: 'Dinner Proposal',
        proposedDates: { start: '2024-10-10' },
        steps: [
          {
            type: 'add_product',
            productId: 1,
            variationId: 2,
            productName: 'Dinner Package',
            quantity: 50, // Matches guest count
            justification: 'Food for everyone'
          }
        ]
      };

      // Act
      const scorecard = await EvaluationService.evaluateProposal('Raw RFP Text', mockRequirements, mockPlan);

      // Assert: The LLM's perfect score is preserved because heuristics passed
      expect(scorecard.finalScore).toBe(100);
      expect(scorecard.isApproved).toBe(true);
      expect(scorecard.missedRequirements).toHaveLength(0);
    });
  });
});
