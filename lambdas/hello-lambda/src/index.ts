import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {capitalize} from 'lodash';
import {thing, other_thing} from '@hometest-service/shared'

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log(event)
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from lambda!',
      thing: capitalize(thing()),
      otherThing: other_thing()
    })
  };
};
