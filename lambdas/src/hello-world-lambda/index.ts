import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log(event)
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Hello world! - from ${process.env.DEPLOYED_LAMBDA_NAME}`,
    })
  };
};
