# GitHub Copilot Instructions

## About the Project

`hometest-service` is an NHS England service that allows patients to order self-test HIV kits at home. It is a TypeScript monorepo with four independently packaged workspaces:

| Workspace | Purpose |
|---|---|
| `ui/` | Next.js 16 static-export shell wrapping a React Router SPA |
| `lambdas/` | AWS Lambda handlers (Node.js ESM, middy middleware) |
| `tests/` | Playwright end-to-end, API, integration, and accessibility tests |
| `database/` | PostgreSQL schema, seed data, and numbered migration scripts |

The application is deployed on AWS (Lambda, API Gateway, RDS, SQS, Secrets Manager, CloudFront/S3). Local development uses Docker Compose with LocalStack.

---

## NHS & Patient Data — Mandatory Rules

This service handles NHS patient data. These rules are non-negotiable:

- **Never log PII.** NHS numbers, dates of birth, full names, addresses, and test results must never appear in log output, error messages, or response bodies beyond what the API contract requires.
- **Always use parameterised SQL.** Never interpolate variables into raw SQL strings.
- **Never hardcode secrets, credentials, or connection strings.** All secrets are managed via AWS Secrets Manager.
- **Before generating any code that stores, transmits, or processes patient data, ask for clarification** about the data classification and whether the approach is appropriate.
- When uncertain about a data-handling decision, surface the question rather than making an assumption.

---

## TypeScript Standards

All four workspaces use TypeScript 5.9.3.

- Always write fully typed code. Never use `any` unless `DBClient.query` type parameters genuinely warrant it, and even then use the generic form (`query<T>(...)`).
- Always define explicit interfaces or types for function parameters and return values — do not rely on inference for public API boundaries.
- Never use `@ts-ignore` or `@ts-nocheck`.
- Use `const` and `let`. Never use `var`.
- Use ESM `import`/`export`. Never use CommonJS `require()`.
- Prefer `unknown` over `any` when the type is genuinely unknown.

---

## Formatting & Linting

All code must satisfy Prettier and ESLint before commit. Pre-commit hooks enforce this.

- **Prettier**: 100-character line width, 2-space indent, double quotes, LF line endings, trailing commas everywhere.
- **ESLint**: `typescript-eslint` strict rules. Each workspace has its own `eslint.config.mjs`.
- **EditorConfig**: 2 spaces for TypeScript/JS/JSON/YAML; 4 spaces for Python/Dockerfile; tabs for Makefile.

---

## Monorepo Structure

```text
ui/           Next.js 16 + React Router SPA frontend
lambdas/      AWS Lambda handlers + shared lib/
tests/        Playwright test suite
database/     Goose SQL migrations and seed data
local-environment/  Docker Compose + LocalStack + Terraform for local dev
.github/      CI/CD workflows, Dependabot, Copilot instructions
```

---

## Git Conventions

- **Branch naming**: `feature/HOTE-[JIRA-ID]-short-description` (e.g. `feature/HOTE-817-copilot-instructions`)
- **Commit messages**: Conventional Commits format — `feat:`, `fix:`, `chore:`, `test:`, `refactor:`, `docs:`, `ci:`
- **Gitflow**: `main` / `develop` / `feature/` / `release/` / `hotfix/`
- **Jira board prefix**: `HOTE`

---

## Testing Expectations

| Layer | Required tests |
|---|---|
| Lambda handler | Jest unit test (`*.test.ts`) + integration test (`*.integration.test.ts`) using `@testcontainers/postgresql` |
| Lambda lib module | Jest unit test |
| UI React component | Jest + React Testing Library unit test |
| UI page/route | Jest + React Testing Library unit test |
| E2E / accessibility | Written by the test engineering team — do not generate these without being asked |

---

## Anti-Patterns — Never Generate These

- `console.log` in lambda or UI production code. Use `console.error` for genuine errors only.
- ORM usage (Prisma, TypeORM, Drizzle, etc.). The DB layer uses raw `pg` with the `DBClient` interface.
- `next/link`, `next/navigation`, or `useRouter` from Next.js. The UI uses React Router for all navigation.
- Next.js API routes (`app/api/` or `pages/api/`). All backend logic lives in Lambda functions.
- Server-side Next.js rendering or server components. The app is `output: "export"` (fully static).
- `dangerouslySetInnerHTML` without explicit sanitisation.
- Inline `style={{...}}` in React components. Use Tailwind classes or `nhsuk-frontend` classes.
- Hardcoded environment-specific URLs, secrets, or feature flags.
- Non-parameterised SQL (string interpolation or concatenation in queries).
- `eval()`, `new Function()`, or dynamic code execution.
- React class components. Use functional components with hooks.
- Default exports for non-component modules (utility files, service classes, constants).

---

## Running the Project

```bash
# Install all workspace dependencies (also installs ui/, lambdas/, tests/ via postinstall)
npm install

# Build and package lambdas (required before first start or after lambda changes)
npm run build:lambdas
npm run package:lambdas

# Start the full local environment (Docker + LocalStack + Terraform deploy + UI)
npm start

# Stop the local environment and destroy Terraform state
npm run stop

# Restart the local environment
npm run local:restart

# Start only the backend (Docker + DB migration)
npm run local:backend:start

# Start only the frontend (Docker UI container)
npm run local:frontend:start

# Run all unit tests (ui + lambdas)
npm test

# Run Playwright tests (reads URLs from Terraform outputs)
npm run test:playwright

# Individual service controls
npm run local:service:db:start       # start Postgres only
npm run local:service:db:migrate     # run DB migrations
npm run local:service:localstack:start  # start LocalStack only
```
