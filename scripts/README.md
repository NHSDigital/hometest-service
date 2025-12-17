# NHS Health Checks scripts

## Saved insights queries

The [deploySavedQueries.js](./saved-queries/deploySavedQueries.js) script located within the `saved-queries` directory is responsible for deploying pre-defined CloudWatch insights queries for a specified environment.

### Prerequisites

You need to have the following set up. This includes the same prereqisites as the main app, see [Install required tools](../README.md#install-required-tools) and [Prerequisites](../README.md#prerequisites) for details.

- NodeJs - the same version as the main service.
- AWS credentials - the same setup as specified for the main service
- External libraries - run `npm install` from the repo root.

### Usage

You can run the script directly with `node saved-queries/deploySavedQueries.js yourEnvName` or from repository root with npm as described [here](../README.md#cloudwatch-saved-queries-generation)

### Adding queries

You can add new saved CloudWatch insights queries by creating new files in the `saved-queries/queries` directory. The folder structure you put the file in will be reflected in CloudWatch insights. The name of the file, will be the name of the query.

The file should contain the definition as seen on the example [here](./saved-queries/queries/healthCheckResults/resultLogsByCorrelationId.js). The module defined in the file should export a function that gets the environment name as a parameter and returns a JSON with the following parameters.

- _query_ - The definition of the [insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AnalyzingLogData.html) query.
- _logGroups_ - An array of log group names. It is advised to use [logGroups.js](./saved-queries/logGroups.js) to define and retrieve them, so that they are not defined in myriad places.
- _stackNames_ - An array of stack names. The query will be attached to all lambda log groups defined within stacks listed there. This property will add those log groups on top of what is defined in _logGroups_
- _excludeEnvs_ - An array of env names to which this query should not be deployed. Useful for queries for mocks or other components not deployable to integrated environments.
