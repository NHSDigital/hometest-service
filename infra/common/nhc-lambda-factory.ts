import type {Construct} from 'constructs';
import {Runtime} from 'aws-cdk-lib/aws-lambda';
import * as path from 'path'
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";

export class NhcLambdaFactory {
  constructor(public scope: Construct, public stackBaseName: string) {
  }

  public createFunction(id: string, dirName: string, environment?: Record<string, string>) {
    return new NodejsFunction(this.scope, id, {
      // Hardcode defaults for LocalStack
      runtime: Runtime.NODEJS_24_X,
      entry: path.join(__dirname, `../../lambdas/src/${this.stackBaseName}/${dirName}/index.ts`),
      handler: 'handler',
      environment: {
        ...environment,
        // Default local environment vars if not provided
        NODE_OPTIONS: '--enable-source-maps',
      },
      bundling: {
        externalModules: ['aws-sdk'], // Don't bundle the old SDK
        minify: false,
        sourceMap: true,
      },
    });
  }
}
