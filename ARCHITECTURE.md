### **ACTUAL ARCHITECTURE.md** ###

THINGS TO ADD LATER ON (~backlog):


***

* Maybe make it easier for people to add their "personal touches" to counteract the tonal sterility of AI-generated text.


***

-------------




* In our ARCHITECTURE.md, we briefly mention the alternative approaches considered and why they were rejected.

Example text: "For data contracts, a modular, co-located strategy was chosen over a central 'types' file to maximize cohesion and support long-term maintainability. For interaction with the Proposales API, a class-based SDK was chosen for its explicit dependency management and encapsulation, in accordance with the principles of minimal, clean abstractions."

* API Client Strategy: For interaction with the Proposales API, we auto-generated TypeScript types directly from their OpenAPI specification using openapi-typescript. This guarantees complete type safety during development. For this assignment, we deliberately omitted runtime validation (e.g., with Zod) of the API responses to prioritize and focus the validation effort on the more unpredictable LLM outputs, where robustness by contract provides the most value.

Under "Retrieval Strategy"
Custom In-Memory Vector Store: To adhere to the principle of "minimal abstractions" and demonstrate a deep understanding of the underlying mechanics, a custom in-memory VectorStore class was implemented from scratch. This approach avoids heavy external dependencies like LangChain/LlamaIndex and provides complete control over the embedding and search logic.

Decoupled Ingestion Pipeline: To ensure "long-term maintainability" and high performance, the computationally expensive ingestion process (where embeddings are generated) is fully decoupled from the application's runtime. A dedicated script (scripts/ingest.ts) is used to build a search index, which is then serialized to a file (vector-store.json). This embodies the "simple solutions over smart ones" philosophy.

"Cold Start" Optimization: The application solves the "cold start" problem by loading the pre-built index directly into memory upon server startup. This makes the retrieval service instantly available with minimal latency and without any runtime dependencies on external APIs, maximizing system robustness and reliability.

* Regarding cold starts/ingestion: "For this code test, a manual ingestion process was chosen to prioritize the core logic. In a production environment, however, the obvious and superior strategy is to leverage Proposales' existing webhook infrastructure. A dedicated, asynchronous endpoint (/api/webhooks/content-updated) would subscribe to events for content creation and updates. This would enable near-instantaneous, granular updates of our vector index, guaranteeing maximum data freshness in the most efficient and resource-friendly manner. This event-driven architecture is preferable to less precise methods like periodic polling or batch jobs." PLUS cron batch-jobs.

Embedding Strategy: The text-embedding-3-small model was chosen for its excellent balance of performance, cost, and vector dimensionality. For each product, a semantically rich text document is created ("Product: {title}\nDescription: {description}") to provide the model with maximum context for generating a high-quality embedding.

Similarity Metric: Cosine similarity is used as the metric to determine the semantic relevance between a user's query and the indexed products. This function (cosineSimilarity) was implemented from scratch to ensure full transparency and control, avoiding hidden "magic."

Under "Honest Trade-offs" or "Production Considerations"
In-Memory Index: The current VectorStore is in-memory, which is ideal for this exercise due to its speed and simplicity. However, it does not scale horizontally across multiple server instances. For a 1,000x scale production environment, this index would be migrated to a shared, persistent data store such as Redis (with the RediSearch module), PostgreSQL (with the pgvector extension), or a managed vector database like Pinecone.

Manual Index Refresh: The index is currently refreshed by manually running the npm run db:ingest script. A production-grade system would automate this process, likely triggered by a webhook from Proposales when content is updated, or as a periodic cron job to ensure the index remains fresh without manual intervention.




Golden Paragraph 1: Model & Cost Routing (Add under "Model Selection" or "Production Considerations")

Text to add:

Pragmatic Model & Cost Routing:
While a powerful model like GPT-4o is used for its superior reasoning in this implementation, a production architecture would employ a model routing strategy. A smaller, faster, and cheaper model (e.g., GPT-3.5-Turbo or a fine-tuned open-source model) would handle a majority of simple requests (like the "Simple" RFP). A classifier prompt or a simple heuristic would first assess the complexity of the incoming RFP. Only the most complex requests (like the "Complex" wedding RFP) would be escalated to the more expensive, high-reasoning model. This layered approach drastically optimizes for both latency and operational cost without significantly compromising on quality for the most common use cases.
Golden Paragraph 2: AI-Specific Security (Create a new section for this)

Text to add:

Security: Building a Defensible AI System
Beyond standard API security, this system is designed with AI-specific threats in mind.

Input/Output Guardrails: All user-provided input (the RFP) and all LLM-generated output are treated as untrusted. The strict, multi-step pipeline acts as a natural defense. For example, the Assemble step is 100% deterministic code, meaning an LLM cannot generate arbitrary API calls to Proposales. It can only suggest which pre-validated products to include in a plan.

Prompt Injection Mitigation: By decomposing the task into multiple steps with highly-structured inputs (Zod-validated JSON), we significantly reduce the attack surface for prompt injection. Instead of injecting malicious instructions into a single, large text prompt, an attacker would need to bypass multiple, purpose-built prompts and structured data validations. In production, this would be further hardened by implementing input sanitization and output analysis to detect and neutralize adversarial instructions.
Golden Paragraph 3: Advanced Agentic Architecture: The "Tool-Using" Agent (Upgrade your "Agent Architecture" section)
This elevates the description of the agent from a mere "pipeline" to a "thinking entity that uses tools", representing the state-of-the-art.


Core Philosophy: A Production-Ready, Tool-Using Agent
My architectural philosophy was to build more than just a pipeline; it's a system designed to reason, plan, and act by using tools. This is achieved by framing each core capability as a "tool" available to the agent:

ProductRetrievalTool: The VectorStore is not just a data source; it's a tool the agent uses to find relevant products.

ProposalAssemblyTool: The final, deterministic code that calls the Proposales API is a safe, reliable tool for execution.

The agent's primary job is not to generate the final output directly, but to generate a plan that orchestrates the use of these tools in a logical sequence. This "Tool-Using" pattern is fundamental to creating reliable, extensible, and observable AI systems. It allows us to isolate non-determinism (the LLM's planning) from deterministic execution (the tools' actions), which is the cornerstone of treating "AI as an Engineering Discipline."


**Pragmatic Boundary Enforcement (The `zod-to-json-schema` trade-off):**
During development, it became clear that relying on abstraction libraries like `zod-to-json-schema` to translate complex Zod contracts into OpenAI's strict JSON Schema format was brittle and prone to silent failures. In accordance with the philosophy of "Simple solutions over clever ones" and to guarantee absolute control over the LLM instructions, the architecture intentionally bypasses this translation layer for complex schemas. 

Instead, we employ a "double boundary":
*   **Outbound (Deterministic):** A hand-crafted, hardcoded JSON Schema is passed directly to OpenAI's tool API. This guarantees the LLM receives unbroken, highly optimized instructions for the required data shape.
*   **Inbound (Defensive):** The raw JSON string returned by the LLM is then strictly parsed and validated by our `zod` schema. 

This isolates the non-deterministic "dragon" in a type-safe "cage," demonstrating that true robustness often requires shedding unreliable abstractions in favor of explicit, engineered contracts.







### 7. Domain Boundaries & Future Constraints Modeling

While this architecture successfully demonstrates a semantic RAG pipeline, it intentionally simplifies the complex reality of hotel inventory management to focus on AI orchestration. In a full production environment, the following domain constraints would need to be addressed:

*   **Inventory Rules & Dependencies (The "A La Carte" Assumption):** Currently, the LLM assumes all products in the `vector-store` are independent and freely combinable. In reality, hospitality inventory has strict dependency rules (e.g., a specific AV package might be incompatible with an outdoor terrace space, or a dietary meal might require the purchase of a base banquet package). A production system would require a deterministic Rule Engine that validates the LLM's proposed plan against these hidden inventory constraints before finalizing the proposal.
*   **Dynamic Pricing & Availability:** The current system does not check real-time availability or dynamic pricing rules (e.g., weekend rates vs. weekday rates). The AI assumes a static catalog. Integrating live availability checks as a mandatory tool call *before* the final Assembly step would be critical to prevent the LLM from proposing fully booked resources.
*   **Human-in-the-Loop (HITL) & Legal Binding:** In B2B hospitality, a proposal is often a legally binding contract. While this agent autonomously drafts the proposal, a production deployment would require a mandatory "Draft State" hand-off. The AI would assemble the proposal in the Proposales system as a draft, notifying a human sales manager for final review, pricing adjustments (discounts), and explicit approval before it is sent to the client. We do not allow the LLM to autonomously execute financially binding actions.






### 10. The Agentic Pipeline (Pillar 2)

The core logic of the system is built around a multi-step, deterministic pipeline that orchestrates non-deterministic AI models. This approach was chosen over a single "Mega-Prompt" or an autonomous "AutoGPT-style" loop.

**Why not a single Mega-Prompt?**
Asking an LLM to read an RFP, search a database, and output a massive, nested JSON payload in one step is a recipe for hallucinations, high latency, and impossible debugging. By decomposing the task, we isolate complexity.

**Why not an Autonomous Loop (Self-Healing Agent)?**
We considered an architecture where the agent critiques its own plan and loops until perfect. This was rejected. It violates the principle of "Simple solutions over clever ones." Autonomous loops introduce unpredictable latency, unbounded costs, and the "blind leading the blind" problem (an LLM confused enough to write a bad plan is often confused enough to approve it).

Instead, the pipeline is strictly linear:
1.  **Extract:** A focused LLM call extracts structured data (dates, guests, special requests) from the raw RFP.
2.  **Retrieve:** We use a Multi-Query Semantic Search strategy. Instead of searching the vector store with the entire RFP, we spawn parallel searches for each extracted requirement (e.g., one search for "vegan meals", one for "projector"). This drastically improves retrieval accuracy over a single, noisy embedding.
3.  **Plan:** A second LLM call acts as the "Event Planner," selecting items from the retrieved catalog to build a logical sequence of blocks.
4.  **Assemble:** A 100% deterministic TypeScript function maps the LLM's plan into the exact JSON payload required by the Proposales API. No AI is used here, ensuring complete safety before network execution.





### 8. Quality Assurance & Evaluation (Pillar 3)

A core tenet of treating AI as an engineering discipline is establishing rigorous, automated evaluation. To prove the system's reliability, a dedicated `EvaluationService` was implemented as a "first-class citizen" in the architecture, completely decoupled from the generation logic.

**The Hybrid Evaluation Strategy:**
The service employs a two-pronged approach to grade the generated proposal against the original RFP:
1.  **Deterministic Heuristics:** Fast, 100% reliable programmatic checks (e.g., "Did the sum of the product quantities match the requested guest count?"). If these fail, the score is mathematically capped, overriding any LLM leniency.
2.  **LLM-as-a-Judge:** A secondary LLM call acts as a strict Quality Assurance Auditor. It uses Chain-of-Thought prompting (enforced by placing the `reasoning` field first in the Zod schema) to evaluate qualitative dimensions like tone and accuracy, outputting a strict `EvaluationScorecard`.

This asynchronous evaluation loop ensures that sales managers are instantly alerted to LLM hallucinations or omissions via the frontend dashboard *before* a proposal is ever sent to a client.

### 9. Frontend & Orchestration (Pillar 4)

In alignment with the instruction that "a clean but simple interface... is far more valuable than a polished app," the frontend was intentionally built using vanilla HTML/JS without heavy frameworks like React.

The `AgentController` acts as the central orchestrator, executing the 5-step pipeline linearly:
`Extract -> Retrieve -> Plan -> Assemble (API Execution) -> Evaluate`

The controller aggregates all intermediate states (the drafted URL, the raw debug plan, and the QA scorecard) into a single JSON response. The vanilla JS frontend acts as a "Sales Dashboard," parsing this payload to provide immediate, transparent observability into the AI's decision-making process.



















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
During development, it became clear that relying on abstraction libraries like `zod-to-json-schema` to translate complex Zod contracts into OpenAI's strict JSON Schema format was brittle and prone to silent failures. In accordance with the philosophy of "Simple solutions over clever ones" and to guarantee absolute control over the LLM instructions, the architecture intentionally bypasses this translation layer for complex schemas. 

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