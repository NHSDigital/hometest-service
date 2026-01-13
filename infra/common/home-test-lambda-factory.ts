import type {Construct} from 'constructs';
import {HomeTestLambdaFunction} from "./home-test-lambda-function";

export class HomeTestLambdaFactory {
  constructor(public scope: Construct, public stackBaseName: string) {
  }

  public createFunction(id: string, environment?: Record<string, string>) {
    return new HomeTestLambdaFunction(this.scope, id, this.stackBaseName, environment);
  }
}
