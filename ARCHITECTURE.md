### **ACTUAL ARCHITECTURE.md** ###

* I vår ARCHITECTURE.md kommer vi kort att nämna de andra alternativen och varför vi valde bort dem.

Exempeltext: "För datakontrakt valdes en modulär, co-located strategi framför en central 'types'-fil för att maximera kohesion och stödja långsiktig underhållsbarhet. För interaktion med Proposales API valdes en klass-baserad SDK för dess explicita beroendehantering och inkapsling, i enlighet med principerna om minimala, rena abstraktioner."





* API Client Strategy: För interaktion med Proposales API har vi auto-genererat TypeScript-typer direkt från deras OpenAPI-specifikation med openapi-typescript. Detta garanterar fullständig typsäkerhet under utveckling. För detta uppdrag har vi medvetet valt bort runtime-validering (t.ex. med Zod) av API-svaren för att prioritera och fokusera valideringsarbetet på de mer oförutsägbara LLM-utdata, där robusthet genom kontrakt ger störst värde.

Under "Retrieval Strategy"
Custom In-Memory Vector Store: To adhere to the principle of "minimal abstractions" and demonstrate a deep understanding of the underlying mechanics, a custom in-memory VectorStore class was implemented from scratch. This approach avoids heavy external dependencies like LangChain/LlamaIndex and provides complete control over the embedding and search logic.

Decoupled Ingestion Pipeline: To ensure "long-term maintainability" and high performance, the computationally expensive ingestion process (where embeddings are generated) is fully decoupled from the application's runtime. A dedicated script (scripts/ingest.ts) is used to build a search index, which is then serialized to a file (vector-store.json). This embodies the "simple solutions over smart ones" philosophy.

"Cold Start" Optimization: The application solves the "cold start" problem by loading the pre-built index directly into memory upon server startup. This makes the retrieval service instantly available with minimal latency and without any runtime dependencies on external APIs, maximizing system robustness and reliability.

* + om cold starts/ingestion: "För detta kodtest valdes en manuell ingestion-process för att prioritera kärnlogiken. I en produktionsmiljö är dock den självklara och överlägsna strategin att använda Proposales befintliga webhook-infrastruktur. En dedikerad, asynkron endpoint (/api/webhooks/content-updated) skulle prenumerera på händelser för skapande och uppdatering av innehåll. Detta skulle möjliggöra nästan omedelbara, granulära uppdateringar av vårt vektorindex, vilket garanterar maximal datafärskhet på det mest effektiva och resurssnåla sättet. Denna händelsestyrda arkitektur är att föredra framför mindre precisa metoder som periodisk polling eller batch-jobb." PLUS cron batch-jobb. 

Embedding Strategy: The text-embedding-3-small model was chosen for its excellent balance of performance, cost, and vector dimensionality. For each product, a semantically rich text document is created ("Product: {title}\nDescription: {description}") to provide the model with maximum context for generating a high-quality embedding.

Similarity Metric: Cosine similarity is used as the metric to determine the semantic relevance between a user's query and the indexed products. This function (cosineSimilarity) was implemented from scratch to ensure full transparency and control, avoiding hidden "magic."

Under "Honest Trade-offs" or "Production Considerations"
In-Memory Index: The current VectorStore is in-memory, which is ideal for this exercise due to its speed and simplicity. However, it does not scale horizontally across multiple server instances. For a 1,000x scale production environment, this index would be migrated to a shared, persistent data store such as Redis (with the RediSearch module), PostgreSQL (with the pgvector extension), or a managed vector database like Pinecone.

Manual Index Refresh: The index is currently refreshed by manually running the npm run db:ingest script. A production-grade system would automate this process, likely triggered by a webhook from Proposales when content is updated, or as a periodic cron job to ensure the index remains fresh without manual intervention.




Guld-Paragraf 1: Model & Cost Routing (Lägg till under "Model Selection" eller "Production Considerations")

Text att lägga till:

Pragmatic Model & Cost Routing:
While a powerful model like GPT-4o is used for its superior reasoning in this implementation, a production architecture would employ a model routing strategy. A smaller, faster, and cheaper model (e.g., GPT-3.5-Turbo or a fine-tuned open-source model) would handle a majority of simple requests (like the "Simple" RFP). A classifier prompt or a simple heuristic would first assess the complexity of the incoming RFP. Only the most complex requests (like the "Complex" wedding RFP) would be escalated to the more expensive, high-reasoning model. This layered approach drastically optimizes for both latency and operational cost without significantly compromising on quality for the most common use cases.
Guld-Paragraf 2: AI-Specific Security (Skapa en ny sektion för detta)

Text att lägga till:

Security: Building a Defensible AI System
Beyond standard API security, this system is designed with AI-specific threats in mind.

Input/Output Guardrails: All user-provided input (the RFP) and all LLM-generated output are treated as untrusted. The strict, multi-step pipeline acts as a natural defense. For example, the Assemble step is 100% deterministic code, meaning an LLM cannot generate arbitrary API calls to Proposales. It can only suggest which pre-validated products to include in a plan.

Prompt Injection Mitigation: By decomposing the task into multiple steps with highly-structured inputs (Zod-validated JSON), we significantly reduce the attack surface for prompt injection. Instead of injecting malicious instructions into a single, large text prompt, an attacker would need to bypass multiple, purpose-built prompts and structured data validations. In production, this would be further hardened by implementing input sanitization and output analysis to detect and neutralize adversarial instructions.
Guld-Paragraf 3: Advanced Agentic Architecture: The "Tool-Using" Agent (Uppgradera din "Agent Architecture"-sektion)
Detta tar din beskrivning av agenten från "en pipeline" till en "en tänkande entitet som använder verktyg", vilket är state-of-the-art.


Core Philosophy: A Production-Ready, Tool-Using Agent
My architectural philosophy was to build more than just a pipeline; it's a system designed to reason, plan, and act by using tools. This is achieved by framing each core capability as a "tool" available to the agent:

ProductRetrievalTool: The VectorStore is not just a data source; it's a tool the agent uses to find relevant products.

ProposalAssemblyTool: The final, deterministic code that calls the Proposales API is a safe, reliable tool for execution.

The agent's primary job is not to generate the final output directly, but to generate a plan that orchestrates the use of these tools in a logical sequence. This "Tool-Using" pattern is fundamental to creating reliable, extensible, and observable AI systems. It allows us to isolate non-determinism (the LLM's planning) from deterministic execution (the tools' actions), which is the cornerstone of treating "AI as an Engineering Discipline."


**Pragmatic Boundary Enforcement (The `zod-to-json-schema` trade-off):**
During development, it became clear that relying on abstraction libraries like `zod-to-json-schema` to translate complex Zod contracts into OpenAI's strict JSON Schema format was brittle and prone to silent failures. In accordance with the philosophy of "Enkla lösningar över smarta" (Simple solutions over clever ones) and to guarantee absolute control over the LLM instructions, the architecture intentionally bypasses this translation layer for complex schemas. 

Instead, we employ a "double boundary":
*   **Outbound (Deterministic):** A hand-crafted, hardcoded JSON Schema is passed directly to OpenAI's tool API. This guarantees the LLM receives unbroken, highly optimized instructions for the required data shape.
*   **Inbound (Defensive):** The raw JSON string returned by the LLM is then strictly parsed and validated by our `zod` schema. 

This isolates the non-deterministic "dragon" in a type-safe "cage," demonstrating that true robustness often requires shedding unreliable abstractions in favor of explicit, engineered contracts.









____________________________________________________________________________________________________________

OLD ARCHITECTURE.MD:





















### **Template 3: `ARCHITECTURE.md` (Your Winning Manifest)**

```markdown
# Architectural Decisions & Rationale

This document outlines the architectural choices and the underlying philosophy for this project. The goal is not just to present a solution, but to demonstrate a mindset geared towards building `production-grade` AI systems.

### 1. Core Philosophy: A Production-Ready Agent Architecture
My architectural philosophy was to build an **Agent architecture** that is more than just a pipeline; it's a system designed to **reason and act**. This is achieved through a pragmatic, production-ready design that focuses on reliability, testability, and maintainability.

### 2. System Structure
The code is divided into two primary layers to ensure a clear separation of concerns:

-   **`api`:** Handles all HTTP-specific tasks, such as receiving requests, validating input, and formatting responses. This layer knows nothing about the underlying AI logic.
-   **`services`:** Contains all core logic. `agent.service.ts` orchestrates the entire AI flow, while `openai.client.ts` acts as a dedicated and isolated gateway to the OpenAI API.

This pragmatic structure is easy to understand yet powerful enough to maintain a testable and maintainable codebase.

### 3. Key Decision: Demonstrating an Understanding of Transformer Fundamentals
This solution does not build a transformer model from scratch, but it is designed with a deep awareness of their fundamental principles and limitations:

-   **Context Window Management:** The RAG pipeline is designed to selectively retrieve and inject only the most relevant context into the prompt. This ensures we respect the model's token limit and avoid sending superfluous information, which is critical for both performance and cost.
-   **Model Selection:** For this test, **[YOUR CHOSEN MODEL, E.G., GPT-4o]** was used for its advanced reasoning capabilities. In a production scenario, a thorough evaluation would be conducted to determine if a smaller, faster model (e.g., an SLM) could solve 80% of cases with sufficient quality, thus optimizing for cost and latency.
-   **Structured Output:** By using Zod to validate the structure of the LLM's response, we handle the model's inherent non-determinism and force it to act as a reliable component within a larger system.

### 4. Key Decision: Intentional Robustness with Zod
A core value in this design is the principle of "Intentional Robustness." I never assume external data is correct, whether from a user or from an LLM.

**Schema Validation (`zod`):**
To ensure system integrity, `zod` schemas are used to validate:

1.  **All incoming data** at the HTTP layer, protecting the system from invalid requests.
2.  **All data received from the OpenAI API.** This is a critical step in building a reliable AI system. By validating the structure of the LLM response, we ensure that the rest of the system always operates on predictable and type-safe data, drastically reducing the risk of unexpected errors.

**Pragmatic Boundary Enforcement (The `zod-to-json-schema` trade-off):**
During development, it became clear that relying on abstraction libraries like `zod-to-json-schema` to translate complex Zod contracts into OpenAI's strict JSON Schema format was brittle and prone to silent failures. In accordance with the philosophy of "Enkla lösningar över smarta" (Simple solutions over clever ones) and to guarantee absolute control over the LLM instructions, the architecture intentionally bypasses this translation layer for complex schemas. 

Instead, we employ a "double boundary":
*   **Outbound (Deterministic):** A hand-crafted, hardcoded JSON Schema is passed directly to OpenAI's tool API. This guarantees the LLM receives unbroken, highly optimized instructions for the required data shape.
*   **Inbound (Defensive):** The raw JSON string returned by the LLM is then strictly parsed and validated by our `zod` schema. 

This isolates the non-deterministic "dragon" in a type-safe "cage," demonstrating that true robustness often requires shedding unreliable abstractions in favor of explicit, engineered contracts.

### 5. Key Decision: A Testable Core
By isolating all external API communication into a dedicated `OpenAIClient` class, we can easily and completely **mock** this layer in our integration tests.

This allows us to verify our entire internal business logic within `agent.service.ts` in a fast and reliable manner, without depending on an external network call. This is fundamental to working according to a `test-driven development` philosophy and ensuring `reliability`.

### 6. The Path to Production & Future Vision

While this is a code challenge, the architecture is designed with production in mind. Here are the next steps:

-   **Deployment:** The service is designed to be easily containerized with Docker and deployed as a **Vercel Serverless Function** for maximum scalability and cost-efficiency.
-   **Asynchronous Flows:** For longer AI tasks, the `agent.service` logic could be moved to a background process using **Vercel Cron Jobs** or a queueing system to avoid HTTP timeouts.
-   **Observability:** All structured logging from `pino` would be piped to a centralized logging service (e.g., Vercel Logs or Datadog) in production to enable real-time monitoring, debugging, and performance analysis.

-   **Integration in a Full-Stack Context (MCP):** To seamlessly integrate this AI service into a modern web application like Proposales, the next step would be to adapt the API to receive richer, structured context from the frontend. A promising standard for this is the **Model Context Protocol (MCP)**. By adopting an MCP-like pattern, the frontend could send not just a text query, but an entire "workspace" of context (e.g., the current proposal document, user history), making the AI agent exponentially more powerful and context-aware.

---
```