// usage: node deploySavedQueries.js joanna
const { ResourceGroupsTaggingAPIClient, GetResourcesCommand } = require('@aws-sdk/client-resource-groups-tagging-api');
const { CloudWatchLogsClient, DescribeQueryDefinitionsCommand, DeleteQueryDefinitionCommand, PutQueryDefinitionCommand } = require('@aws-sdk/client-cloudwatch-logs');
const fs = require('fs');
const path = require('path');

const stackTagKey = 'aws:cloudformation:stack-name';
const region = 'eu-west-2';

// Global cache for log groups
const logGroupsCache = {};

async function getLogGroupsByStackTag(stackName) {
  // Check cache first
  if (logGroupsCache[stackName]) {
    return logGroupsCache[stackName];
  }

  const resourceGroupsTaggingClient = new ResourceGroupsTaggingAPIClient({ region });

  const params = {
    TagFilters: [
      {
        Key: stackTagKey,
        Values: [stackName],
      },
    ],
    ResourceTypeFilters: ['logs:log-group'],
  };

  try {
    const response = await resourceGroupsTaggingClient.send(new GetResourcesCommand(params));
    const logGroups = response.ResourceTagMappingList.map((mapping) => {
      const parts = mapping.ResourceARN.split(':');
      return parts[parts.length - 1].replace(/^\/aws\/logs\//, '');
    }).filter((logGroupName) => logGroupName.match(/lambda/));

    // Store in cache
    logGroupsCache[stackName] = logGroups;

    return logGroups;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

function findQueryFiles(dir) {
  let queryFiles = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      queryFiles = queryFiles.concat(findQueryFiles(fullPath));
    } else if (fullPath.endsWith('.js')) {
      queryFiles.push(fullPath);
    }
  }

  return queryFiles;
}

async function deploySavedQueries(stage) {
  const cloudWatchLogsClient = new CloudWatchLogsClient({ region });

  try {
    // Describe existing query definitions
    const describeResponse = await cloudWatchLogsClient.send(new DescribeQueryDefinitionsCommand({
      queryDefinitionNamePrefix: stage,
    }));

    console.log(`Detected the following queries defined for ${stage} env.`, { 
      queries: describeResponse.queryDefinitions.map(query => query.name) 
    });

    const existingQueries = describeResponse.queryDefinitions.map(query => query.queryDefinitionId);

    const shouldDeleteQueries = await new Promise((resolve) => {
      const noPrompt = process.argv.includes('--no-prompt');
      if(noPrompt) { resolve(true); return; }

      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      readline.question(`This action will delete the above and re-create the defined queries for stage ${stage} on AWS account - please type y to continue\n`, (answer) => {
        readline.close();
        resolve(answer === 'y');
      });
    });

    if (!shouldDeleteQueries) {
      return;
    }

    console.log(`Deleting all previously deployed queries for the ${stage} environment`);
    for (const queryDefinitionId of existingQueries) {
      await cloudWatchLogsClient.send(new DeleteQueryDefinitionCommand({
        queryDefinitionId,
      }));
    }

    // Recursively read and deploy new queries
    const queryDir = path.join(__dirname, 'queries');
    const queryFiles = findQueryFiles(queryDir);

    for (const file of queryFiles) {
      const queryModulePath = path.resolve(file);
      const queryModule = require(queryModulePath);
      const { query, logGroups, stackNames, excludeEnvs } = queryModule(stage);
      if (excludeEnvs && excludeEnvs.includes(stage)) {
        continue;
      }

      let resolvedLogGroups = logGroups || [];
      for (const stackName of stackNames || []) {
        const stackLogGroups = await getLogGroupsByStackTag(stackName);
        resolvedLogGroups = resolvedLogGroups.concat(stackLogGroups);
      }

      // Get the relative path for the query name
      const relativePath = path.relative(queryDir, file);
      const queryName = `${stage}/${relativePath.replace(/\.js$/, '')}`;

      console.log(`Processing query ${queryName}`);
      await cloudWatchLogsClient.send(new PutQueryDefinitionCommand({
        name: queryName,
        queryString: query,
        logGroupNames: resolvedLogGroups,
      }));
    }

    console.log('Saved queries deployed successfully');
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function main() {
  const stage = process.argv[2];

  if (!stage) {
    console.error('Stage parameter is required');
    process.exit(1);
  }

  try {
    await deploySavedQueries(stage);
  } catch (error) {
    console.error(error);
  }
}

main();
