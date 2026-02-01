# Lambda Functions

This directory contains all AWS Lambda functions for the project.
Each Lambda is organised as a subdirectory within the shared `src/` folder.

## Structure

```text
lambdas/
 ├── src/
 │   ├── some-lambda/
 │   │   ├── index.ts
 │   │   └── [other files]
 │   ├── another-lambda/
 │   │   ├── index.ts
 │   │   └── [other files]
 │   └── lib # shared code
 └── package.json
```

## Development Rules

### Directory Naming

- All Lambdas must be direct subdirectories of `src/`
- Lambda directory names must end with `-lambda` suffix
- Each Lambda directory contains its handler and related code

### Dependencies

- Shared `package.json` at the root level for all Lambdas
- All dependencies are managed centrally
- Use monorepo approach for dependency management

### Build Process

- Each Lambda is built independently using `esbuild`
- TypeScript source code is compiled and bundled into a single JavaScript file
- Output is optimised for AWS Lambda runtime (Node.js 24.x)
- Build targets `src/{lambda-name}/index.ts` as entry point
- To run the build process, run `npm run build`
- An individual Lambda can be built by running `npm run build -- --lambda {lambda-name}`

### Packaging Process

- Each Lambda is packaged as a ZIP archive
- The archives can be found in the `dist/` directory
- To create the ZIP archives, run `npm run package`
- An individual Lambda can be packaged by running `npm run package -- --lambda {lambda-name}`

### Local Deployment

- Lambdas are deployed via Terraform using `archive_file` data source
- To deploy all Lambdas, run `npm run local:terrform:apply`
    - This is a wrapper for the script with the same name in the root `package.json`
- Each Lambda gets its own IAM role with minimal required permissions

### Local Development

- Use LocalStack for local testing
- Deploy via Terraform: `npm run local:terraform:apply`
- Functions are available at `http://localhost:4566`

### Best Practices

- Keep handler functions small and focused
- Use environment variables for configuration
- Include proper error handling and logging
- Follow the single responsibility principle per Lambda
- Each Lambda must have an `index.ts` file with the main handler
