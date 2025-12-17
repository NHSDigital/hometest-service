Your goal is to generate or update a mock endpoint for an external API to unblock testing prior to the integration being available.

## Overview

Determine if the user wants to **create a new mock endpoint** or **update an existing one**.

- **Creation**: Involves setting up infrastructure (CDK), API Gateway configuration, and the initial Lambda function.
- **Update**: Focuses on locating the existing Lambda code and modifying its logic or data.

## Information Gathering

Ask the user for the following if not provided:

- **Action**: Create new or Update existing?
- **Lambda Name/ID**: What is the service or endpoint called?
- **Path & Method**: (For creation) e.g., `POST /my-api/v1/resource`.
- **Behavior Logic**:
  - Should it return specific status codes based on payload/path?
  - Should it serve static JSON files? If so, how is the filename derived?
- **Documentation**: Link to the external API spec if available.

## Scenario A: Creating a new mock endpoint

1.  **Infrastructure (`infra/dev/stacks/nhc-mocks-stack.ts`)**:

    - Create a new Lambda function using the project's `LambdaFactory` pattern.
    - Group configuration in a private method like `configure<ServiceName>Mock` (follow existing examples like `configureNhsNotifyMock`).
    - Add the endpoint to the existing mock API Gateway API.
    - Add the endpoint to the right path:
      - for a new third-party endpoint create apigateway.Resource under `api` root object
      - for a new endpoint on API platform create apigateway.Resource under `nhsApiPlatformMockApi` resource
    - Expose the endpoint URL as a `readonly` property on the stack class for other stacks to consume.

    ```typescript
    // Example usage in stack
    const notifyApi = this.configureNhsNotifyMock(
      nhsApiPlatformMockApi,
      lambdaFactory
    );
    this.notifyApiEndpointUrl = api.urlForPath(notifyApi.path);
    ```

2.  **Lambda Setup**:
    - Create a new directory: `lambdas/src/nhc-mocks-stack/<lambda-name>/`.
    - Create `index.ts` (handler)
    - Create any necessary static JSON files within a `scenarios` subfolder if needed.
    - Implement the logic based on user requirements (conditional responses, static JSON serving, etc.).

## Scenario B: Updating an existing mock endpoint

1.  **Locate Code**:

    - Find the Lambda function code in `lambdas/src/nhc-mocks-stack/<lambda-name>/`.
    - If infrastructure changes are needed (e.g., changing timeout, memory, or path), check `infra/dev/stacks/nhc-mocks-stack.ts`.

2.  **Modify Logic**:
    - Update `index.ts` to reflect the new requirements.
    - Add or update static JSON files in the same directory if the response strategy changes.

## Implementation Details (Lambda Logic)

Implement one of two clear response strategies:

### Simple Logic

- Use inline conditional logic with `event.pathParameters`, `event.queryStringParameters`, and parsed `event.body` as needed.
- Return fixed or computed payloads and appropriate HTTP status codes (200, 400, 404, 500).
- Examples:
  - Return 500 if `JSON.parse(event.body).type` indicates an error condition.
  - If `event.pathParameters?.id === '123'`, return a payload with `id: '123'` and a test value.

### Scenario-based Logic

- Store JSON payloads under a `scenarios/` folder (e.g., `success-response.json`, `http-error.json`).
- Derive the scenario filename deterministically from request data; document the mapping.
  - Examples:
    - Path-based: `const filename = \`by-id-${event.pathParameters?.id}.json\`;`
    - Query-based: `const filename = \`status-${event.queryStringParameters?.status}.json\`;`
    - Body-based: `const type = JSON.parse(event.body).type; const filename = \`type-${type}.json\`;`
- Read the selected file using `fs` and `path.join(..., 'scenarios', filename)`.
  - Handle missing files gracefully (return 404 or a sensible default, and log the missing scenario).

#### Bundling Scenarios Folder

- If your Lambda returns payloads from JSON files under `scenarios/`, ensure this folder is bundled. Simple mocks that return inline objects or fixed responses do not need this bundling.
- Mirror the approach used in `configurePdmApiMock`, where static assets are explicitly included during bundling.
- For new or updated mocks that use scenarios, make sure the CDK/Lambda bundling settings include the `scenarios` directory so the files are available at runtime.
  - Path resolution for bundled scenarios: Use the project helper `import { __dirname } from '../../lib/path';` and then `path.join(__dirname, 'scenarios', filename)` so paths resolve correctly in the Lambda runtime.

### Models

- Use existing models from `shared/models` if available.
- If creating new models, place them in `shared/models` to be reusable.
