# AI Collaboration Log

This document highlights key moments of collaboration with AI tools (Cursor / Claude 3.5 Sonnet) during the development of this project. It focuses on how AI was used not just as a code generator, but as a sparring partner for architectural decisions, debugging, and prompt engineering.

## 1. Establishing the "God Prompt" & Architecture First
Instead of immediately asking the AI to write code, I started by feeding it the assignment instructions, researching Proposales' customers, and establishing a strict persona and architectural philosophy. This "God Prompt" was used consistently throughout the project to anchor all AI suggestions.

**My Prompt:**
> "Act as a Senior Staff AI Engineer mentoring me. We are building a production-grade AI agent for Proposales. Before we write any code, we need to establish our architectural pillars. We will prioritize deterministic boundaries, strict data contracts (Zod), and 'fail-fast' error handling over clever mega-prompts. Let's draft an ARCHITECTURE.md file together..."

**The Result:** This set the tone for the entire project. The AI stopped suggesting brittle "all-in-one" LangChain solutions and instead helped me design the isolated, testable 5-step pipeline we see today.

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
> "implement robust debug logging in all relevant files. -> [still not finding the problem] -> add even more debug logging, in the affected area."

**The Result:** By systematically adding `console.log` statements around the LLM's raw JSON output (`toolCall.function.arguments`), we found the "smoking gun": the LLM was omitting required fields because of a missing description in a manual JSON Schema override. The fix took 1 minute once the logs exposed the truth.

## 5. Breaking AI "Planning Loops"
Occasionally, the AI in Cursor would get stuck in a loop, repeatedly suggesting the same flawed approach or failing to synthesize new context.

**My Prompt:**
> "Hi. What's up? **please clear your recent planning, i.e. 'press the reset button on this AI model' if you may, thanks. Thing is: you're stuck in your ways :)**"

**The Result:** Forcing a context reset and explicitly telling the AI it was stuck broke the loop and allowed us to approach the problem from a fresh angle.

## Summary
Throughout this project, I used AI to accelerate boilerplate generation and to act as a sounding board for architectural trade-offs. By maintaining strict control over the system design, forcing the AI to evaluate alternatives, and relying on robust debug logging, I ensured the final product was built with engineering rigor rather than blind trust in LLM outputs.