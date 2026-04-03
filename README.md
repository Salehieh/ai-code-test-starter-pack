### **Template 1: `README.md` (Your Welcoming Front Door)**

```markdown
# Proposales AI Engineer - Code Challenge
**By:** Samuel Salehieh

---

### ► Live Interactive Demo

To eliminate all friction and allow you to test the solution immediately, a live, interactive web demo of the API is available here:

**URL:** `[PASTE YOUR NGROK LINK HERE]`

---

### 1. Problem Description

[INSERT A CONCISE DESCRIPTION OF THE TASK YOU SOLVED. E.G., "This project is a full-stack application featuring a Node.js service that implements an AI agent to [SOLVE PROBLEM X], and a simple vanilla JS interface for demonstration."]

For a deep dive into my technical and architectural decisions, please see the dedicated document: **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

### 2. Prerequisites

- Node.js (v18 or later)
- npm
- An OpenAI API Key

### 3. Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [YOUR-REPO-URL]
    cd [YOUR-REPO-NAME]
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure environment variables:**
    - Create a `.env` file in the project root by copying `.env.example`.
    - Add your OpenAI API key to the `.env` file:
      ```
      OPENAI_API_KEY=sk-xxxxxxxxxxxx
      ```

### 4. Running the Application

```bash
npm start
```
The server will now be running at `http://localhost:3000` (or your chosen port), serving the interactive demo.

### 5. Running Tests

All tests are designed to run in isolation and mock external API calls to ensure fast and reliable results.

```bash
npm test
```

### 6. API Usage (Example)

You can also interact with the API directly via `curl` or any API client.

```bash
curl -X POST http://localhost:3000/api/agent \
-H "Content-Type: application/json" \
-d '{
  "rfpText": "Hi, we are looking for a venue for a 2-day tech summit for 50 people. We will need a main conference room, a projector, and lunch on both days. We also have 3 vegans in the group."
}'
```

---
```
