import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {Construct} from "constructs";
import {FunctionUrlAuthType, Runtime} from "aws-cdk-lib/aws-lambda";
import * as path from 'path';


export class HomeTestLambdaFunction extends NodejsFunction {
  constructor(scope: Construct, id: string, stackName: string, environment?: Record<string, string>) {
    super(scope, id, {
      runtime: Runtime.NODEJS_24_X,
      entry: path.join(__dirname, `../../lambdas/src/${stackName}/${id}/index.ts`),
      handler: 'handler',
      environment: {
        ...environment,
        NODE_OPTIONS: '--enable-source-maps',
      },
      bundling: {
        externalModules: ['aws-sdk'],
        minify: false,
        sourceMap: true,
      },
    });
  }

  makePublic() {
    this.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
    })
  }
}
