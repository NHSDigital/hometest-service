import jwt, { type SignOptions } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

import { type INhsLoginConfig } from "../models/nhs-login/nhs-login-config";

export interface INhsLoginJwtHelper {
  createClientAuthJwt: () => string;
}

// ALPHA: Removed commons use. To be reintroduced for logging later.
export class NhsLoginJwtHelper implements INhsLoginJwtHelper {
  readonly nhsLoginConfig: INhsLoginConfig;

  constructor(nhsLoginConfig: INhsLoginConfig) {
    this.nhsLoginConfig = nhsLoginConfig;
  }

  public createClientAuthJwt(): string {
    const clientTokenSignOptions: SignOptions = {
      algorithm: "RS512",
      subject: this.nhsLoginConfig.clientId,
      issuer: this.nhsLoginConfig.clientId,
      audience: `${this.nhsLoginConfig.baseUri}/token`,
      jwtid: uuidv4(),
      expiresIn: this.nhsLoginConfig.expiresIn,
    };

    const signedToken = jwt.sign({}, this.nhsLoginConfig.privateKey, clientTokenSignOptions);
    return signedToken;
  }
}
