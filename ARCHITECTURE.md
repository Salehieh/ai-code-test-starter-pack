### **ACTUAL ARCHITECTURE.md** ###

* I vår ARCHITECTURE.md kommer vi kort att nämna de andra alternativen och varför vi valde bort dem.

Exempeltext: "För datakontrakt valdes en modulär, co-located strategi framför en central 'types'-fil för att maximera kohesion och stödja långsiktig underhållsbarhet. För interaktion med Proposales API valdes en klass-baserad SDK för dess explicita beroendehantering och inkapsling, i enlighet med principerna om minimala, rena abstraktioner."





* API Client Strategy: För interaktion med Proposales API har vi auto-genererat TypeScript-typer direkt från deras OpenAPI-specifikation med openapi-typescript. Detta garanterar fullständig typsäkerhet under utveckling. För detta uppdrag har vi medvetet valt bort runtime-validering (t.ex. med Zod) av API-svaren för att prioritera och fokusera valideringsarbetet på de mer oförutsägbara LLM-utdata, där robusthet genom kontrakt ger störst värde.





















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

This defensive approach is fundamental to moving from an AI prototype to a `reliable`, `production-grade` service.

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