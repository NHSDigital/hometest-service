This is a repository of the NHS Health Checks project

## Project Overview

- The project is a serverless application comprising multiple CDK apps.
- The codebase is TypeScript-first, with a focus on clean architecture and modular design.

## Repository Structure

- `lambdas/`: Contains AWS Lambda functions and their services.
- `infra/`: Contains AWS CDK infrastructure code.
- `perf-tests/`: Contains performance tests for the application.
- `scripts/`: Contains utility scripts for development and deployment.
- `ui/`: Contains the user interface code, which is a React application served via CloudFront.
- `tests/`: Contains automated tests for the application.
- `integration-utils/`: Contains additional tools such as Postman collections for our app as well as third-party APIs.
- `data/`: Contains data such as files used to populate the database.

## General Guidelines

- Prefer TypeScript for all new code.
- Include concise comments only when necessary.
- Follow the existing directory structure and naming conventions.
- Use dependency injection for services and clients.
- Write clear and concise code following clean code principles and design patterns.

## Unit Testing

- Place unit tests in the `__tests__` directory within the same directory structure as the code file being tested.
- Use Jest for all the tests.
- provide mocking with sinon library where possible.
- Use `describe`, `it`, and `beforeEach` for test structure.
- Use `When ... then ...` pattern for test descriptions.
- Create parametrized tests when possible to avoid repetition.

## Infrastructure

- Infrastructure code should be placed in the appropriate `infra/` subdirectory based on the CDK app it belongs to:
  - `db`: app with database-related infrastructure and resources
  - `main`: main app with backend logic and core services
  - `dev`: app for development purposes only, containing mocks and other resources deployed on non-production environments
  - `security`: app containing security-related infrastructure and resources
  - `shared`: app containing shared resources deployed once per AWS account
- The `common` subdirectory contains shared code reused by multiple CDK apps like custom CDK constructs and utility functions.
- Environment configuration files (e.g. int, prod) should be placed in the /env subdirectory of the respective CDK app.
- Each CDK app have its own `settings.ts` file for environment-specific configurations loaded at runtime based on the environment configuration files.
- The infrastructure code for stacks of a CDK app is located in `infra/<app-name>/stacks/` directory.

## Backend Services

- The backend services are written using AWS Lambda in node.js using TypeScript.
- Each lambda should have its own service class, typically named `<LambdaName>Service`.
- The lambda code should be placed in the `lambdas/src/<stack-name>/<lambda-name>/` directory.
- The lambda handler should be named `index.ts` and should export a default handler function.
- The lambda initialization code should be placed in the `init.ts` file within the same directory.

## Additional Notes

- Always check for existing utilities or helpers before creating new ones.
- Use environment variables and configuration files as shown in the project.
- Ask questions when there is uncertainty about the codebase or project structure.
