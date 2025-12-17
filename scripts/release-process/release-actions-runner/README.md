# Release Actions Runner

A TypeScript-based Node.js CLI tool for running release process actions such as database schema migrations.

## Features

- Runs actions (e.g. pre-release, post-release) associated with specific release tag of the service against a specific health check environment
- Supports running DynamoDB data migrations based on full table scans
- Allows a dry-run flag to be passed to invoke actions without performing changes (the output allows to determine the need for the update)

## Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Build the project:**

   ```bash
   npm run build
   ```

   This will bundle the app into `dist/index.js` using ESBuild.

## Usage

Run the release actions runner with:

```bash
npm run start -- --env <environment> --tag <release-tag> --jobType <job-type> [--dryRun]
```

Example of running actions defined for post-release of v3.0.0 in a dry run mode:

```bash
npm run start -- --env develop --tag v3.0.0 --jobType post-release --dryRun
```

### Parameters

- `env` (string): The environment name (e.g., `develop`, `test`, `prod`)
- `tag` (string): The release tag (e.g., `v3.0.0`)
- `jobType` (string): The job type (supported values are `pre-release` or `post-release`)
- `dryRun` (boolean, optional): If set, runs in dry run mode (no changes are made but logs are printed out)

## Output

When running the tool, detailed logs about the processing steps are printed to standard output.

Additionally, for DynamoDb migrations CSV files are generated in the `output/` directory. These CSV files help track which entities were processed successfully or failed during a migration or release action helping with troubleshooting.

- **CSV file naming:** Each migration that logs to CSV will generate files named `<action-name>-success.csv` and `<action-name>-failure.csv`, where `<action-name>` is the name of the migration or action.
- **CSV format:** For health check migrations, each CSV file includes the following columns:
  - `healthCheckId`: The ID of the processed health check item.
  - `step`: The step or status associated with the health check.
- **Empty files:** If a migration does not log any entries, the corresponding CSV file is automatically removed at the end of the process.

## Adding new actions

To add a new action:

- Add a new class implementing the `IAction` interface in `actions/<tag>/<jobType>`
- Register your action in `src/actions-registry.ts`
- For any database schema migrations ensure the dataModelVersionHistory field is updated to contain a new entry

## Project Structure

- `src/` - Main source code (framework, executor, types)
- `actions/` - action scripts, organized by release tag and job type
