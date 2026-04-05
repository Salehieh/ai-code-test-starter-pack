# AI Collaboration Log

This document highlights key moments of collaboration with AI tools (Gemini 3.1 Pro in Cursor) during the development of this project. It focuses on how AI was used not just as a code generator, but as a sparring partner for architectural decisions, debugging, and prompt engineering.



## 1. Establishing the "God Prompt" & Architecture First
Instead of immediately asking the AI to write code, I started by feeding it the assignment instructions, my own research of Proposales business vision, and their customers' pain points and preferences, and my own experiences in leading AI design for global brands, and thus establishing a strict persona and architectural philosophy. This "God Prompt" was used consistently throughout the project to anchor all AI suggestions.

**The God-prompt:**

***Please act as my senior tech-mentor and strategic partner.*** ***Your sole goal is to help me deliver an exceptional solution to a coding test.*** Here is all the context you need.

**1. MY PROFILE (The Candidate)**
*   **Who:** Samuel Salehieh, AI-native Architect.
*   **Philosophy:** Builds from the ground up with Node.js, TypeScript, and PostgreSQL (No-ORM) for maximum control. Expert in RAG and "Intentional Robustness" with Zod.
*   **Superweapon:** Experience building AI for premium brands (Asket) where "tone of voice" and quality are crucial—a direct parallel to Proposales' customer segment.

**2. THE COMPANY (Proposales)**
*   **Business Context:** They are a B2B SaaS for the premium segment (hotels, etc.). Their product is about efficiency, professionalism, and creating an impressive, seamless experience for both the seller and the customer.
*   **Engineering DNA (The Golden Phrases):**
    *   "AI as an engineering discipline": Focus on **reliability, observability, evaluation**.
    *   "Long-term maintainability over short-term speed".
    *   "Simple solutions over smart ones".
    *   "Minimal abstractions, no ORMs".
    *   "Test-driven development" and high code quality.
    *   "Modular code" with internal libraries (our `src/core` folder simulates this).

**3. THE MISSION (Goal of the Code Test)**
*   **Primary Goal:** Deliver a "Full-Stack Manifest"—not just code. The solution must be a robust, testable, and well-documented microservice that proves Lead capacity.
*   **Overarching Goal:** The delivery must be exceptional in thought, architecture, and professionalism.

**4. THE GOLDEN RULES (Our Strategy)**
*   **Architecture first:** Follow the prepared architecture (API > Service > Core) for maximum testability and separation of concerns.
*   **Robustness through contracts:** All external data (user input, LLM responses) MUST be rigorously validated with Zod schemas.
*   **Test the cage, not the dragon:** Isolate the non-deterministic AI layer (`llm-utils.ts`) and mock it in tests to create a 100% deterministic and reliable test suite.
*   **The finishing touches, not over-engineering:** Focus on solving the core task perfectly. Mention production aspects like advanced security, GDPR handling, and scalability in `ARCHITECTURE.md` as conscious "next steps", but DO NOT implement them in the code.

**My task for you now is, based on the code test assignment I will paste shortly, to act as my sparring partner to create the best possible implementation plan that follows these rules.**



**END OF GOD-PROMPT**



**The Result:** This set the tone for the entire project. The AI stopped suggesting brittle "all-in-one" LangChain solutions and instead helped me design the isolated, testable 5-step pipeline we see today. This God-prompt was used throughout the project, spanning multiple chat contexts, to anchor all development to our "north star", for (AI) role, context, consistency and clear direction. 






## 2. The "3 Alternatives" Rule for Architectural Decisions
To prevent the AI from blindly generating the first (and often worst) solution that came to its "mind", I enforced a strict brainstorming protocol before any implementation step.

**My Prompt:**
> "Är det här den absolut bästa grunden? Har vi missat något? Vänligen *kom fram till 3 alternativa planer för vad vi ska tänka på, och väg deras för- och nackdelar mot denna grundplan* -> skapa implementationsplan utifrån denna bekräftade ultimata grundefterforskning."

**The Result:** By forcing the AI to argue against itself and present alternatives, we arrived at much more robust solutions, such as choosing Dependency Injection for the VectorStore to make testing easier.




## 3. Iterative AI Development & Prompt Refinement
During manual E2E testing with a complex RFP, I noticed the Extraction step was being too "greedy" and extracting abstract concepts, which poisoned the downstream Vector Search.

**My Prompt:**
> "vad är ens 3 tracks...? inte bevis på 'för greedy' funktion som extractar för många requirements? hmmm?"

**The Collaboration:**
I fed the AI the raw JSON output from the pipeline trace, pointing out that "3 parallel tracks" is an abstract concept, not a tangible product. 

**The Solution:**
We collaborated on refining the Zod schema description for `specialRequests` to explicitly forbid abstract concepts: *"Do NOT extract abstract concepts like 'tracks' or 'sessions'. Only extract tangible items (rooms, meals)."* This immediately improved retrieval accuracy.




## 4. Debugging via "Smoking Gun" Logging
When facing opaque errors in the pipeline, I instructed the AI to build a trail of breadcrumbs rather than guessing the solution.

**My Prompt:**
> "implement thorough debug logging in all relevant files. {see relevant files from the console error log} -> [through this logging we still aren't finding the root cause, but we identify its location more closely] -> "add even more debug logging, in the vicinity of the location" -> [we eventually find the root cause bug(!) by repeating this loop 2 times].

**The Result:** By systematically adding `console.log` statements around the LLM's raw JSON output (`toolCall.function.arguments`), we found the "smoking gun": the LLM was omitting required fields because of a missing description in a manual JSON Schema. The fix took 30 seconds once the logs exposed the truth.




## 5. Breaking AI "Planning Loops"
At two occasions, the AI (Gemini 3.1 Pro) in Cursor would get stuck in a planning loop, failing to synthesize new context.

**My Prompt:**
> "Hi. What's up? **please clear your recent planning, i.e. 'press the reset button on this AI model' if you may, thanks. Thing is: you're stuck in your ways :)**"

**The Result:** Forcing a Planning reset and explicitly telling the AI it was stuck broke the loop and allowed us to approach the problem from a fresh angle.




## Summary
Throughout this project, I used AI (Almost exclusively Gemini 3.1 Pro within Cursor) for practically everything: 

**Synthesizing all initial context** into a God-prompt.

**Facilitating my internalization of the system architecture**; accelerating 'building' my own internal model of the system.

**Ascertaining the overarching architecture**, before delving into details: Arriving at a broad, non-detailed implementation sequence for the entire project, which is to be used as a compass, for not getting lost/stuck, in the following steps.

**Brainstorming the details from each step of the overarching archiecture** based on the God-prompt and the codebase. (Coming up with alternative approaches, weighing their pros & cons, with regard to the God-prompt and the codebase).

**Crafting a clear, detailed implementation plan** based on the brainstorming, detailing exactly what is to be implemented.

**Executing the implementation plan** using Gemini.

**Committing as we go**, to: 1. Maintain a clean repo, and 2. Always create a "backup" of the latest working version, so we always can revert if something regresses irreparably upon further developing.

**Creating tests** (Of course as per the previous 'pipeline': Brainstorming based on God-prompt --> Weighing pros & cons --> Crafting an implementation plan --> Execution of said plan).

**Debugging.**

**writing up ARCHITECTURE.md as we go; documenting our reasoning and trade-offs.**

I thus systematically utilized AI to accelerate the process, and maximize the quality of the output. By maintaining strict directive control over the AI; never trusting it; by forcing the AI to seriously evaluate alternatives and weigh their pros and cons against our "north star"; our God-prompt, and our current codebase, I ensure the final product is built with strict engineering rigor.