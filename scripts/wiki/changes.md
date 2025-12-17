# Changes Documentation

## Comparison Details

- **Old Commit**: `cda7e809b2248c02733e6fefca6c58d9fbedea8a`
- **Latest Commit (main)**: `1c0b4616430708ba8216f9a104b434792eb08d38`
- **Generated**: 2025-11-21 16:28:11

---

## Latest Commit Hash on Main

```
1c0b4616430708ba8216f9a104b434792eb08d38
```

---

## Summary

**Total commits**: 15

## Changed Files

- ✅ **Added**: `lambdas/src/nhc-reporting-stack/create-athena-view-lambda/create-athena-view-service.ts`
- ✅ **Added**: `lambdas/src/nhc-reporting-stack/create-athena-view-lambda/index.ts`
- ✅ **Added**: `lambdas/src/nhc-reporting-stack/create-athena-view-lambda/init.ts`

## Detailed Changes

```diff
diff --git a/lambdas/src/nhc-reporting-stack/create-athena-view-lambda/create-athena-view-service.ts b/lambdas/src/nhc-reporting-stack/create-athena-view-lambda/create-athena-view-service.ts
new file mode 100644
index 000000000..fac212f81
--- /dev/null
+++ b/lambdas/src/nhc-reporting-stack/create-athena-view-lambda/create-athena-view-service.ts
@@ -0,0 +1,110 @@
+import { Service } from '../../lib/service';
+import type { AthenaClientService } from '../../lib/aws/athena-client';
+import type { GlueClientService } from '../../lib/aws/glue-client';
+import type { Commons } from '../../lib/commons';
+
+export interface CreateAthenaViewServiceParams {
+  glueClientService: GlueClientService;
+  athenaClientService: AthenaClientService;
+  outputLocation: string;
+  databaseName: string;
+  workgroup: string;
+}
+
+export default class CreateAthenaViewService extends Service {
+  private readonly glueClientService: GlueClientService;
+  private readonly athenaClientService: AthenaClientService;
+  private readonly outputLocation: string;
+  private readonly databaseName: string;
+  private readonly workgroup: string;
+
+  constructor(commons: Commons, params: CreateAthenaViewServiceParams) {
+    super(commons, 'CreateAthenaViewService');
+    this.glueClientService = params.glueClientService;
+    this.athenaClientService = params.athenaClientService;
+    this.outputLocation = params.outputLocation;
+    this.databaseName = params.databaseName;
+    this.workgroup = params.workgroup;
+  }
+
+  public async createAthenaView(namedQueryId: string): Promise<void> {
+    this.logger.info(`Retrieving named query: ${namedQueryId}`);
+
+    const namedQuery =
+      await this.athenaClientService.getNamedQuery(namedQueryId);
+
+    if (!namedQuery) {
+      throw new Error(`Named query ${namedQueryId} not found.`);
+    }
+
+    const queryString = namedQuery.QueryString;
+    if (queryString === null || queryString === undefined) {
+      throw new Error(`Named query ${namedQueryId} has no QueryString.`);
+    }
+
+    const queryExecutionId = await this.athenaClientService.startQueryExecution(
+      queryString,
+      this.databaseName,
+      this.outputLocation,
+      this.workgroup
+    );
+
+    this.logger.info(`QueryExecutionId: ${queryExecutionId}`);
+
+    await this.awaitExecutionCompletion(queryExecutionId);
+
+    const viewName = await this.extractViewName(queryString);
+
+    this.logger.info(`Verifying view ${viewName} exists in Glue catalog.`);
+
+    const table = await this.glueClientService.getTable(
+      this.databaseName,
+      viewName
+    );
+
+    if (!table) {
+      throw new Error(
+        `View ${viewName} not found in Glue catalog database ${this.databaseName}.`
+      );
+    }
+
+    this.logger.info(
+      `Successfully created Athena view ${viewName} in database ${this.databaseName}.`
+    );
+  }
+
+  private async awaitExecutionCompletion(
+    queryExecutionId: string
+  ): Promise<void> {
+    let state = 'RUNNING';
+    while (state === 'RUNNING' || state === 'QUEUED') {
+      await new Promise((r) => setTimeout(r, 3000));
+
+      const queryExecution =
+        await this.athenaClientService.getQueryExecution(queryExecutionId);
+
+      state = queryExecution?.Status?.State ?? 'UNKNOWN';
+      this.logger.info(`Current state: ${state}`);
+
+      if (state === 'FAILED') {
+        const reason = queryExecution?.Status?.StateChangeReason;
+        throw new Error(`Athena query failed: ${reason}`);
+      }
+    }
+
+    this.logger.info(`Query finished with state: ${state}`);
+  }
+
+  private async extractViewName(queryString: string): Promise<string> {
+    const match =
+      /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+([^\s(;]+)(?=\s+AS\b)/i.exec(
+        queryString
+      );
+    const token = match ? match[1] : null;
+    if (!token)
+      throw new Error(`Could not extract view name from query: ${queryString}`);
+    const cleaned = token.replaceAll(/["`]/g, '');
+
+    return cleaned;
+  }
+}
diff --git a/lambdas/src/nhc-reporting-stack/create-athena-view-lambda/index.ts b/lambdas/src/nhc-reporting-stack/create-athena-view-lambda/index.ts
new file mode 100644
index 000000000..ed1337c43
--- /dev/null
+++ b/lambdas/src/nhc-reporting-stack/create-athena-view-lambda/index.ts
@@ -0,0 +1,39 @@
+import { init } from './init';
+import { Commons } from 'src/lib/commons';
+
+interface CreateAthenaViewEvent {
+  namedQueryId: string;
+}
+
+const className = 'handler';
+
+const commons = new Commons('reporting', 'create-athena-view-lambda');
+const { createAthenaViewService } = await init(commons);
+
+export const handler = async (event: CreateAthenaViewEvent) => {
+  const namedQueryId = event.namedQueryId;
+  if (!namedQueryId) throw new Error("Missing 'namedQueryId' in event.");
+
+  commons.logInfo(className, `Retrieving named query: ${namedQueryId}`);
+
+  try {
+    await createAthenaViewService.createAthenaView(namedQueryId);
+
+    commons.logInfo(
+      className,
+      `Successfully created Athena view '${namedQueryId}'`
+    );
+
+    return {
+      LambdaResult: {
+        status: 'SUCCESS'
+      }
+    };
+  } catch (error) {
+    commons.logError(
+      className,
+      `Error creating Athena view '${namedQueryId}': ${(error as Error).message}`
+    );
+    throw error;
+  }
+};
diff --git a/lambdas/src/nhc-reporting-stack/create-athena-view-lambda/init.ts b/lambdas/src/nhc-reporting-stack/create-athena-view-lambda/init.ts
new file mode 100644
index 000000000..db4b17e4b
--- /dev/null
+++ b/lambdas/src/nhc-reporting-stack/create-athena-view-lambda/init.ts
@@ -0,0 +1,51 @@
+import { AthenaClient } from '@aws-sdk/client-athena';
+import { GlueClient } from '@aws-sdk/client-glue';
+import { AthenaClientService } from 'src/lib/aws/athena-client';
+import { GlueClientService } from 'src/lib/aws/glue-client';
+import type { Commons } from 'src/lib/commons';
+import { retrieveMandatoryEnvVariable } from 'src/lib/utils';
+import CreateAthenaViewService from './create-athena-view-service';
+
+const envVars: CreateAthenaViewEnvVariables = {
+  outputLocation: retrieveMandatoryEnvVariable('ATHENA_OUTPUT_LOCATION'),
+  databaseName: retrieveMandatoryEnvVariable('DATABASE_NAME'),
+  workgroup: retrieveMandatoryEnvVariable('WORKGROUP_NAME')
+};
+
+interface CreateAthenaViewEnvVariables {
+  outputLocation: string;
+  databaseName: string;
+  workgroup: string;
+}
+
+interface CreateAthenaViewDependencies {
+  createAthenaViewService: CreateAthenaViewService;
+}
+
+const className = 'init';
+
+export async function init(
+  commons: Commons
+): Promise<CreateAthenaViewDependencies> {
+  commons.logInfo(className, 'creating dependencies');
+
+  const athenaClient = new AthenaClient({});
+  const athenaClientService = new AthenaClientService(commons, athenaClient);
+
+  const glueClient = new GlueClient({});
+  const glueClientService = new GlueClientService(commons, glueClient);
+
+  const createAthenaViewService = new CreateAthenaViewService(commons, {
+    glueClientService,
+    athenaClientService,
+    outputLocation: envVars.outputLocation,
+    databaseName: envVars.databaseName,
+    workgroup: envVars.workgroup
+  });
+
+  commons.logInfo(className, 'finished creating dependencies');
+
+  return {
+    createAthenaViewService
+  };
+}
```
