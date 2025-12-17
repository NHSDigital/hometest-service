import * as jwt from 'jsonwebtoken';

export interface SessionItem {
  sessionId: string;
  accessToken: string;
  nhsNumber: string;
  ttl: number;
}

export default class JwtTokenHelper {
  public getSessionIdFromToken(authToken: string): string {
    const tokenData = jwt.decode(authToken) as jwt.JwtPayload;
    console.debug('Decoded token', tokenData);
    return tokenData.sessionId as string;
  }
}
