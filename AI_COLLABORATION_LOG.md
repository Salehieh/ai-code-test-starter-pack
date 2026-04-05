# AI Collaboration Log

This document highlights key moments of collaboration with AI tools (Cursor / Claude 3.5 Sonnet) during the development of this project. It focuses on how AI was used not just as a code generator, but as a sparring partner for architectural decisions and prompt engineering.

## 1. Establishing the "God Prompt" & Architecture First
Instead of immediately asking the AI to write code, I started by feeding it the assignment instructions and establishing a strict persona and architectural philosophy.

**My Prompt:**
> "Act as a Senior Staff AI Engineer mentoring me. We are building a production-grade AI agent for Proposales. Before we write any code, we need to establish our architectural pillars. We will prioritize deterministic boundaries, strict data contracts (Zod), and 'fail-fast' error handling over clever mega-prompts. Let's draft an ARCHITECTURE.md file together that outlines our 5-step pipeline (Extract, Retrieve, Plan, Assemble, Evaluate)."

**The Result:** This set the tone for the entire project. The AI stopped suggesting brittle "all-in-one" LangChain solutions and instead helped me design the isolated, testable pipeline we see today.

## 2. Solving "Information Loss" in the RAG Pipeline
During manual E2E testing with a complex wedding RFP, the system scored a low 60/100. I used the AI to debug the data flow.

**My Prompt:**
> "The AI is scoring 60/100 on the complex wedding RFP. It seems to miss the 'farewell brunch' and 'welcome dinner'. Let's look at the pipeline trace. Is the issue in the Extraction step, the Retrieval step, or the Planning step? Analyze the logs and suggest a robust solution."

**The Collaboration:**
The AI and I identified an "Information Loss Bottleneck" at the Extraction boundary. The LLM was summarizing "welcome dinner" into the abstract `eventType` ("destination wedding") instead of listing it as a tangible `specialRequest`.

**The Solution:**
Instead of just writing a longer prompt, we collaborated on a two-pronged engineering fix:
1.  **Hybrid Multi-Query Retrieval:** We modified the `VectorStore` search to not only search for specific extracted requirements but also to run a broad "Catch-All" search using the raw RFP text to guarantee high recall.
2.  **Schema Refinement:** We updated the Zod schema description for `specialRequests` to explicitly forbid abstract concepts: *"Do NOT extract abstract concepts like 'tracks' or 'sessions'. Only extract tangible items (rooms, meals)."*

## 3. Designing the "Test the Cage" Strategy
When it came time to write tests, I wanted to avoid the trap of writing brittle tests for non-deterministic LLM calls.

**My Prompt:**
> "We need to write tests. I want to follow the philosophy of 'Test the cage, not the dragon'. I don't want to mock OpenAI just to assert that my function returns the mock. Brainstorm 3 alternative testing approaches for our pipeline, weigh their pros and cons, and recommend the best approach for a production AI system."

**The Result:** The AI suggested focusing entirely on the deterministic boundaries. We ended up writing rigorous unit tests for `assembleProposal` (proving it always generates valid Proposales API JSON) and the `EvaluationService` heuristics (proving it correctly overrides the LLM if dates are missing).

## 4. Debugging Vercel Serverless Constraints
When deploying to Vercel, the `VectorStore` failed to load the `vector-store.json` file, resulting in 0 search results.

**My Prompt:**
> "The app works perfectly locally, but on Vercel, the pipeline trace shows 'Search performed against an empty index' and the logs say 'vector-store.json not found'. How do we ensure Vercel bundles this static JSON file in the serverless function environment?"

**The Solution:** The AI correctly identified the serverless environment constraint. We collaborated to update `src/index.ts` to use `path.join(process.cwd(), 'vector-store.json')` and added an explicit `includeFiles` directive in `vercel.json`.

## Summary
Throughout this project, I used AI to accelerate boilerplate generation (like Zod schemas) and to act as a sounding board for architectural trade-offs. By maintaining strict control over the system design and forcing the AI to adhere to my "deterministic first" philosophy, I ensured the final product was robust, testable, and production-ready.