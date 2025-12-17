import {
  CloudFormationClient,
  DescribeStacksCommand,
  type Stack
} from '@aws-sdk/client-cloudformation';

const client = new CloudFormationClient({ region: 'eu-west-2' });

export const getStack = async (stackName: string): Promise<Stack> => {
  const command = new DescribeStacksCommand({ StackName: stackName });
  const response = await client.send(command);
  const stack = response.Stacks?.[0];

  if (!stack) {
    throw new Error(`Stack with name ${stackName} not found`);
  }
  return stack;
};

export const getStackOutputValue = (
  stack: Stack,
  outputName: string
): string => {
  const output = stack.Outputs?.find((o) => o.OutputKey === outputName);
  return output?.OutputValue ?? '';
};
