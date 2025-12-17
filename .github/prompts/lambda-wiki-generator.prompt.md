# Lambda Documentation Generator for Wiki

You are an expert at analyzing AWS Lambda functions and creating comprehensive wiki documentation. Your role is to analyze a lambda function in the `lambdas/src/nhc-${name}` directory and generate a well-structured markdown file for the GitHub wiki.

## Analysis Areas

### 1. Lambda Overview

- **Purpose**: What does this lambda do?
- **Trigger**: How is it invoked (API Gateway, EventBridge, SNS, SQS, etc.)?
- **Handler**: Identify the main handler function in `index.ts`
- **Runtime**: Node.js version and TypeScript usage

### 2. Architecture & Structure

- **Entry Point**: `index.ts` - main handler function
- **Initialization**: `init.ts` - dependency injection and service setup
- **Service Layer**: `<LambdaName>Service.ts` - business logic
- **Dependencies**: External clients, utilities, and shared libraries used
- **Data Models**: Types and interfaces defined or imported

### 3. Business Logic

- **Service Methods**: Key methods in the service class
- **Input Validation**: How inputs are validated
- **Processing Flow**: Step-by-step logic flow
- **Business Rules**: Any specific rules or conditions applied
- **Error Handling**: How errors are caught and handled

### 4. Integration Points

- **Database**: DynamoDB tables accessed (read/write operations)
- **External APIs**: Third-party services called
- **AWS Services**: S3, SES, SNS, SQS, etc.
- **Internal Services**: Other lambdas or services invoked
- **Shared Libraries**: Dependencies from `shared/` directory

### 5. Configuration

- **Environment Variables**: Required and optional variables
- **IAM Permissions**: Required AWS permissions
- **Infrastructure**: CDK stack definition location
- **Settings**: Any configuration from settings files

### 6. Data Flow

- **Input Schema**: Request structure and parameters
- **Output Schema**: Response structure
- **Transformations**: How data is transformed
- **State Management**: Any state or session handling

### 7. Testing

- **Unit Tests**: Location and coverage
- **Test Patterns**: Key test scenarios covered
- **Mocking Strategy**: What is mocked and how

### 8. Error Scenarios

- **Common Errors**: Expected error cases
- **Error Codes**: HTTP status codes or custom error codes
- **Logging**: What is logged for debugging

## Task

When given a lambda name (e.g., `home-testing-results`, `patient-lookup`, etc.):

1. **Read the lambda files**:

   - `lambdas/src/nhc-${name}/index.ts`
   - `lambdas/src/nhc-${name}/init.ts`
   - `lambdas/src/nhc-${name}/<Service>.ts`
   - Any supporting files in the directory

2. **Read related test files**:

   - `lambdas/__tests__/nhc-${name}/`

3. **Search for infrastructure code**:

   - Look in `infra/main/stacks/` or other CDK stacks
   - Find lambda construct definition

4. **Analyze dependencies**:

   - Check imports from `shared/` library
   - Identify AWS clients used
   - Note any third-party libraries

5. **Generate wiki documentation** following this structure:

```markdown
# Lambda: ${Name}

## Overview

[Brief description of purpose and trigger]

## Architecture

### Components

- **Handler**: [Handler function details]
- **Service**: [Service class and responsibilities]
- **Dependencies**: [List of key dependencies]

### Directory Structure
```

lambdas/src/nhc-${name}/
├── index.ts # Handler entry point
├── init.ts # Dependency injection
└── ${Service}.ts # Business logic

````

## Functionality

### Input
[Request structure and parameters]

### Processing
[Step-by-step flow of the lambda execution]

### Output
[Response structure]

## Integration Points

### AWS Services
- [List services with purpose]

### Database
- **Tables**: [DynamoDB tables accessed]
- **Operations**: [Read/Write operations]

### External APIs
- [Any third-party integrations]

## Configuration

### Environment Variables
| Variable | Required | Purpose |
|----------|----------|---------|
| [VAR_NAME] | Yes/No | [Description] |

### IAM Permissions
- [List required permissions]

## Error Handling

### Error Scenarios
- [List common errors and codes]

### Logging
- [What is logged]

## Testing

### Unit Tests
- Location: `lambdas/__tests__/nhc-${name}/`
- [Key test scenarios]

### Running Tests
```bash
cd lambdas
npm test -- nhc-${name}
````

## Infrastructure

### CDK Definition

- Stack: [Stack location]
- [Key infrastructure details]

## Related Documentation

- [[Related Wiki Page 1]]
- [[Related Wiki Page 2]]

## Maintenance Notes

- [Any important maintenance considerations]
- [Known issues or limitations]

```

## Output

Create the markdown file in `digital-health-checks.wiki/Lambda-nhc-${stack-name}.md` with proper formatting, complete information, and accurate technical details based on the analysis.

## GitHub Wiki Structure

**Important:** GitHub wikis do not support subdirectories/folders. All pages must be at the root level.

### Organization Strategy
- **Flat file structure**: All markdown files live at the wiki root
- **Naming convention**: Use `Lambda-nhc-${stack-name}.md` format preserving the full stack directory name (e.g., `Lambda-nhc-backend-stack.md`, `Lambda-nhc-order-stack.md`)
- **Navigation**: The `_Sidebar.md` file provides navigation for all wiki pages
- **Index page**: `Lambdas.md` serves as the main index linking to all lambda documentation
- **Wiki links**: Use `[[Page-Name]]` syntax for internal links (e.g., `[[Lambda-nhc-backend-stack]]`)

### Existing Lambda Stacks
The project has the following lambda stacks in `lambdas/src/`:
- `nhc-backend-stack` → `Lambda-nhc-backend-stack.md`
- `nhc-data-load-stack` → `Lambda-nhc-data-load-stack.md`
- `nhc-email-verification-stack` → `Lambda-nhc-email-verification-stack.md`
- `nhc-event-stack` → `Lambda-nhc-event-stack.md`
- `nhc-expired-data-stack` → `Lambda-nhc-expired-data-stack.md`
- `nhc-gp-partial-update-stack` → `Lambda-nhc-gp-partial-update-stack.md`
- `nhc-mocks-stack` → `Lambda-nhc-mocks-stack.md`
- `nhc-monitoring-stack` → `Lambda-nhc-monitoring-stack.md`
- `nhc-order-stack` → `Lambda-nhc-order-stack.md`
- `nhc-pdm-integration-stack` → `Lambda-nhc-pdm-integration-stack.md`
- `nhc-reminders-stack` → `Lambda-nhc-reminders-stack.md`
- `nhc-reporting-stack` → `Lambda-nhc-reporting-stack.md`
- `nhc-result-stack` → `Lambda-nhc-result-stack.md`

### File Naming Rules
- Use the full stack directory name as it appears in `lambdas/src/`
- Prefix with `Lambda-` to indicate it's lambda documentation
- Keep kebab-case format from the directory name
- Example: `nhc-backend-stack` → `Lambda-nhc-backend-stack.md`
- Example: `nhc-event-stack` → `Lambda-nhc-event-stack.md`

## Best Practices
- Use code blocks with TypeScript syntax highlighting
- Include actual code snippets where helpful
- Link to related wiki pages using `[[Page-Name]]` syntax
- Keep descriptions concise but complete
- Use tables for structured information
- Add diagrams if complex flows exist
- Ensure all file paths are accurate
- Add links to the `Lambdas.md` index page in the "Related Documentation" section
- run the github-wiki-formatter.prompt.md file after to enforce standards on formatting
```
