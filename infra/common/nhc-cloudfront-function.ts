import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import type { Construct } from 'constructs';
import * as path from 'path';
import { ResourceNamingService } from './resource-naming-service';

export class NhcCloudfrontFunction extends cloudfront.Function {
  readonly keyValueStoreArn: string;

  constructor(scope: Construct, envName: string, functionName: string) {
    const namingService = new ResourceNamingService(envName);

    // Key value pair "isServiceDown" need to be added manualy in the post-deployment
    const keyValueStore = new cloudfront.KeyValueStore(
      scope,
      `${namingService.getEnvSpecificResourceName(functionName)}-kv-store`,
      {
        keyValueStoreName: `${namingService.getEnvSpecificResourceName(functionName)}-kv-store`
      }
    );

    super(scope, functionName, {
      functionName: namingService.getEnvSpecificResourceName(functionName),
      code: cloudfront.FunctionCode.fromFile({
        filePath: path.join(
          __dirname,
          `./../../lambdas/src/lib/cloudfront-functions/${functionName}.js`
        )
      }),
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      comment: '',
      keyValueStore
    });

    this.keyValueStoreArn = keyValueStore.keyValueStoreArn;
  }
}
