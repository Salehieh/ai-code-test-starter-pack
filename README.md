# Proposales AI Engineer - Code Challenge
**By:** Samuel Salehieh

---

### ► Live Interactive Demo

To eliminate all friction and allow you to test the solution immediately, a live, interactive web demo of the API is available here:

**URL:** https://ai-code-test-starter-pack.vercel.app

---

### 1. Problem Description

This project implements a production-grade, deterministic AI pipeline that transforms unstructured Requests for Proposals (RFPs) into fully structured, legally sound draft proposals via the Proposales API.

It features a 5-step agentic architecture (Extract -> Retrieve -> Plan -> Assemble -> Evaluate) designed to isolate non-deterministic LLM behavior within strict Zod data contracts. The solution includes a custom in-memory VectorStore for semantic retrieval and a dedicated Quality Assurance Evaluator (LLM-as-a-judge) to provide Human-in-the-Loop guardrails.

For a deep dive into my technical and architectural decisions, please see the dedicated document: **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

### 2. Prerequisites

- Node.js (v18 or later)
- npm
- An OpenAI API Key
- A Proposales API Key

### 3. Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Salehieh/ai-code-test-starter-pack.git
    cd ai-code-test-starter-pack
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure environment variables:**
    - Create a `.env` file in the project root.
    - Add your API keys to the `.env` file:
      ```
      OPENAI_API_KEY=sk-xxxxxxxxxxxx
      PROPOSALES_API_KEY=xxxxxxxxxxxx
      PROPOSALES_COMPANY_ID=xxxxxxxxxxxx
      ```

### 4. Running the Application

```bash
npm run dev
```
The server will now be running at `http://localhost:3000`, serving the interactive vanilla JS dashboard.

### 5. Running Tests

The testing strategy strictly follows "Test the cage, not the dragon." All tests run in isolation, mocking external API calls to mathematically prove the deterministic boundaries of the system (e.g., the `assembleProposal` payload generation and the `EvaluationService` heuristic overrides).

```bash
npm run test
```

### 6. API Usage (Example)

You can interact with the API directly via `curl`:

```bash
curl -X POST http://localhost:3000/api/agent \
-H "Content-Type: application/json" \
-d '{
  "rfpText": "Hi, we are looking for a venue for a 2-day tech summit for 50 people. We will need a main conference room, a projector, and lunch on both days. We also have 3 vegans in the group."
}'
```
