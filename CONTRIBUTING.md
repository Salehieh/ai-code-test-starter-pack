### **Template 2: `CONTRIBUTING.md` (Your "Lead Engineer" Signal)**

```markdown
# Contribution Guidelines

This document outlines the guidelines and conventions used in this project to ensure high code quality and smooth collaboration—principles I consider fundamental for any production-ready project.

### Code Quality

We use **ESLint** and **Prettier** to maintain a consistent code style. Before committing your code, please ensure you run:

```bash
# Format all code
npm run format

# Lint to find any potential issues
npm run lint```

### Commit Messages

This project follows the **Conventional Commits** standard. This creates a clean and readable Git history, which is crucial for maintainability in a team environment.

Examples of valid commit messages:

-   **feat:** `feat: implement user authentication endpoint`
-   **fix:** `fix: correct calculation in discount logic`
-   **docs:** `docs: update ARCHITECTURE.md with new decisions`
-   **test:** `test: add integration test for agent service`
-   **refactor:** `refactor: simplify openai client implementation`

### Tests

All new features and bug fixes should be covered by meaningful tests. All tests must pass before a Pull Request can be merged. Run the full test suite with:

```bash
npm test
```
```