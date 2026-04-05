# Contribution Guidelines

This document outlines the guidelines and conventions used in this project to ensure high code quality and smooth collaboration—principles I consider fundamental for any production-ready project.

### Code Quality

We use **ESLint** and **Prettier** to maintain a consistent code style. Before committing your code, please ensure you run:

```bash
# Format all code
npm run format

# Lint to find any potential issues
npm run lint
```

### Commit Messages

This project follows the **Conventional Commits** standard. This creates a clean and readable Git history, which is crucial for maintainability in a team environment.

Examples of valid commit messages:

-   **feat:** `feat: implement user authentication endpoint`
-   **fix:** `fix: correct calculation in discount logic`
-   **docs:** `docs: update ARCHITECTURE.md with new decisions`
-   **test:** `test: add integration test for agent service`
-   **refactor:** `refactor: simplify openai client implementation`
-   **chore:** `chore: set up core project infrastructure`

### Tests & Evaluation-Driven Development (EDD)

All new features and bug fixes should be covered by meaningful tests. We follow the philosophy of "Test the cage, not the dragon," meaning we strictly unit-test deterministic boundaries (like `assembleProposal`) and heuristic guardrails rather than writing brittle assertions against mocked LLM outputs.

All tests must pass before a Pull Request can be merged. Run the full test suite with:

```bash
npm run test
```

*Note for future contributors:* As the system scales, we plan to implement automated EDD pipelines in CI/CD. Future PRs will be evaluated against a Golden Dataset of RFPs to measure regressions in Retrieval Accuracy (Recall@K) and Plan Quality before merging.