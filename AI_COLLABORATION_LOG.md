# AI Collaboration Log

This document highlights key moments of collaboration with AI tools (Cursor / Claude 3.5 Sonnet) during the development of this project. It focuses on how AI was used not just as a code generator, but as a sparring partner for architectural decisions, debugging, and prompt engineering.

## 1. Establishing the "God Prompt" & Architecture First
Instead of immediately asking the AI to write code, I started by feeding it the assignment instructions, researching Proposales' customers, and establishing a strict persona and architectural philosophy. This "God Prompt" was used consistently throughout the project to anchor all AI suggestions.

**My Prompt:**
> 

**The God-prompt:**

***Vänligen agera som min seniora tech-mentor och strategiska partner.*** ***Ditt enda mål är att hjälpa mig att leverera en exceptionell lösning på ett kodtest och säkra rollen som Lead AI Engineer.*** Här är all kontext du behöver.

**1. MIN PROFIL (Kandidaten)**
*   **Vem:** Samuel Salehieh, AI-native Architect.
*   **Filosofi:** Bygger från grunden med Node.js, TypeScript och PostgreSQL (No-ORM) för maximal kontroll. Expert på RAG och "Intentional Robustness" med Zod.
*   **Supervapen:** Erfarenhet av att bygga AI för premium-varumärken (Asket) där "tone of voice" och kvalitet är avgörande, en direkt parallell till Proposales kundsegment.

**2. FÖRETAGET (Proposales)**
*   **Affärskontext:** De är en B2B SaaS för premium-segmentet (hotell etc.). Deras produkt handlar om effektivitet, professionalism och att skapa en imponerande, sömlös upplevelse för både säljare och kund.
*   **Ingenjörs-DNA (De Gyllene Fraserna):**
    *   "AI som en ingenjörsdisciplin": Fokus på **tillförlitlighet, observerbarhet, utvärdering**.
    *   "Långsiktig underhållsbarhet över kortsiktig hastighet".
    *   "Enkla lösningar över smarta".
    *   "Minimala abstraktioner, inga ORMs".
    *   "Test-driven utveckling" och hög kodkvalitet.
    *   "Modulär kod" med interna bibliotek (vår `src/core`-mapp simulerar detta).

**3. UPPDRAGET (Målet för Kodtestet)**
*   **Huvudmål:** Leverera ett "Full-Stack Manifest" – inte bara kod. Lösningen ska vara en robust, testbar och väldokumenterad mikrotjänst som bevisar Lead-kapacitet.
*   **Övergripande Mål:** Leveransen ska vara så överlägsen i tanke, arkitektur och professionalism att anställningsbeslutet blir självklart.

**4. DE GYLLENE REGLERNA (Vår Strategi)**
*   **Arkitektur först:** Följ den förberedda arkitekturen (API > Service > Core) för maximal testbarhet och separation of concerns.
*   **Robusthet genom kontrakt:** All extern data (användarinput, LLM-svar) MÅSTE valideras rigoröst med Zod-scheman.
*   **Testa buren, inte draken:** Isolera det icke-deterministiska AI-lagret (`llm-utils.ts`) och mocka det i testerna för att skapa en 100% deterministisk och pålitlig testsvit.
*   **Pricken över i:et, inte över-ingenjörskonst:** Fokusera på att lösa kärnuppgiften perfekt. Nämn produktionsaspekter som avancerad säkerhet, GDPR-hantering och skalbarhet i `ARCHITECTURE.md` som medvetna "nästa steg", men implementera dem INTE i koden.
*   **Kommunicera som en Lead:** Använd deras "Gyllene Fraser" i all dokumentation (`README.md`, `ARCHITECTURE.md`) och i commit-meddelanden för att visa att du förstår och delar deras kultur.

**Min uppgift till dig är nu att, baserat på den kodtest-uppgift jag strax kommer att klistra in, agera som min sparringpartner för att skapa den bästa möjliga implementationsplanen som följer dessa regler.**


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
> "implement thorough debug logging in all relevant files. {see relevant files from the console error log} -> [through this logging we still are not finding the root cause, but we identify its location more closely] -> "add even more debug logging, in the vicinity of the location" -> [we find the root cause bug(!) by repeating this loop 2 times].

**The Result:** By systematically adding `console.log` statements around the LLM's raw JSON output (`toolCall.function.arguments`), we found the "smoking gun": the LLM was omitting required fields because of a missing description in a manual JSON Schema. The fix took 30 seconds once the logs exposed the truth.

## 5. Breaking AI "Planning Loops"
At two occasions, the AI (Gemini 3.1 Pro) in Cursor would get stuck in a planning loop, failing to synthesize new context.

**My Prompt:**
> "Hi. What's up? **please clear your recent planning, i.e. 'press the reset button on this AI model' if you may, thanks. Thing is: you're stuck in your ways :)**"

**The Result:** Forcing a Planning reset and explicitly telling the AI it was stuck broke the loop and allowed us to approach the problem from a fresh angle.

## Summary
Throughout this project, I used AI (Gemini 3.1 Pro within Cursor) for practically everything: 

*   **Synthesizing all initial context** (Technical Case's instructions, my own Proposales customer and business research, AI best practices) into a 'God-prompt'.
*   **Facilitating my internalization of the system architecture;** accelerating the building of my own internal mental model of the system.
*   **Ascertaining the overarching architecture before delving into details:** Arriving at a broad, non-detailed implementation sequence for the entire project, which served as a compass to avoid getting lost in the weeds.
*   **Systematic Brainstorming:** Going through each step from the overarching architecture and brainstorming based on the God-prompt and the codebase (forcing the AI to come up with alternative approaches to a specific problem, weighing their pros & cons).
*   **Crafting clear implementation plans:** Based on the brainstorming, detailing exactly what is to be implemented—how, where, and why.
*   **Executing the implementation plan** using Gemini.
*   **Atomic Committing as we go:** To maintain a clean repo and always create a "backup" of the latest working version, allowing us to revert if something regressed irreparably.
*   **Creating tests** (following the same pipeline: Brainstorming based on God-prompt -> weighing pros & cons -> crafting an implementation plan -> execution).
*   **Debugging and writing up ARCHITECTURE.md as we go;** documenting our reasoning and trade-offs in real-time.

I thus systematically utilized AI to accelerate the process and maximize the quality of the output. By maintaining strict directive control over the AI; never trusting it, by forcing the AI to seriously evaluate alternatives and weigh their pros and cons against our "north star"–Our God-prompt—and our current codebase, I ensure the final product is built with strict engineering rigor.