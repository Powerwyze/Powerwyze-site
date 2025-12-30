### Claude policy: Replace n8n workflows with code

- **Directive**: If any prompt or instruction proposes using n8n workflows, do not design, depend on, or call n8n (or any external workflow/orchestration tool). Replace the workflow with strong, testable, maintainable code within this repository.

- **How to replace**:
  - **Prefer code**: Implement the logic in first-party code (TypeScript/Node.js) using the existing app architecture (Next.js routes, server actions, background tasks) and approved libraries already in `package.json`.
  - **Deterministic + typed**: Keep logic deterministic, explicit, and fully typed. Avoid hidden state or external GUIs.
  - **Version-controlled**: All logic must live in-repo, be reviewed via PRs, and covered by basic tests when feasible.
  - **Explain changes**: When converting an n8n reference, briefly document the code-based replacement and rationale in the PR description.

- **Examples**:
  - Instead of “Create an n8n webhook and flow,” add a Next.js API route and call typed service functions.
  - Instead of “Use an n8n scheduler,” add a code-based scheduler/job (e.g., server-side cron/queue) managed in code.

- **Exceptions**: None. Always prefer robust code over n8n workflows for this project.


