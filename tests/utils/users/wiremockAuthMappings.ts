import { createSign, generateKeyPairSync } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

import type { WireMockMapping } from "../../api/clients/WireMockClient";
import { WireMockClient } from "../../api/clients/WireMockClient";
import type { NHSLoginMockedUser } from "./BaseUser";
import { SpecialUserKey } from "./SpecialUserKey";

const WIREMOCK_ISSUER = "http://wiremock:8080";
const WIREMOCK_AUDIENCE = "hometest";
const WIREMOCK_SCOPE = "openid profile email phone nhs_number";
const TOKEN_LIFETIME_SECONDS = 60 * 60;
const WIREMOCK_SESSION_CACHE_DIR = path.resolve(__dirname, "../../.session-cache");
const WIREMOCK_AUTH_MANIFEST_PATH = path.resolve(
  __dirname,
  "../../.session-cache/wiremock-auth-manifest.json",
);

const DEFAULT_WORKER_USERS: ReadonlyArray<NHSLoginMockedUser> = [
  {
    nhsNumber: "9912003071",
    dob: "1990-01-01",
    code: "wiremock-auth-code",
    familyName: "MILLAR",
    givenName: "Mona",
    identityProofingLevel: "P9",
    email: "mona.millar@example.com",
    phoneNumber: "+447700900000",
    gpOdsCode: "Y12345",
  },
  {
    nhsNumber: "9912003072",
    dob: "1990-01-01",
    code: "wiremock-auth-code",
    familyName: "SMITH",
    givenName: "John",
    identityProofingLevel: "P9",
    email: "john.smith@example.com",
    phoneNumber: "+447700900001",
    gpOdsCode: "Y12345",
  },
  {
    nhsNumber: "9912003073",
    dob: "1990-01-01",
    code: "wiremock-auth-code",
    familyName: "JONES",
    givenName: "Jane",
    identityProofingLevel: "P9",
    email: "jane.jones@example.com",
    phoneNumber: "+447700900002",
    gpOdsCode: "Y12345",
  },
  {
    nhsNumber: "9912003074",
    dob: "1990-01-01",
    code: "wiremock-auth-code",
    familyName: "BROWN",
    givenName: "Robert",
    identityProofingLevel: "P9",
    email: "robert.brown@example.com",
    phoneNumber: "+447700900003",
    gpOdsCode: "Y12345",
  },
];

const DEFAULT_SPECIAL_USERS: Readonly<Record<SpecialUserKey, NHSLoginMockedUser>> = {
  [SpecialUserKey.UNDER_18]: {
    nhsNumber: "9686883932",
    dob: "2009-04-06",
    age: 16,
    code: "wiremock-auth-code",
  },
};

interface WireMockJwk {
  kty: string;
  n: string;
  e: string;
  kid: string;
  use: string;
  alg: string;
}

export interface WireMockAuthContext {
  kid: string;
  sub: string;
  code: string;
  accessToken: string;
  idToken: string;
  refreshToken: string;
  publicJwk: WireMockJwk;
}

export interface WireMockAuthUser extends NHSLoginMockedUser {
  authContext: WireMockAuthContext;
}

export interface WireMockAuthManifest {
  createdAt: string;
  workerUsers: WireMockAuthUser[];
  specialUsers: Record<SpecialUserKey, WireMockAuthUser>;
}

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function signJwt(
  privateKeyPem: string,
  kid: string,
  payload: Record<string, string | number>,
): string {
  const header = {
    alg: "RS512",
    typ: "JWT",
    kid,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signer = createSign("RSA-SHA512");

  signer.update(signingInput);
  signer.end();

  const signature = signer.sign(privateKeyPem).toString("base64url");
  return `${signingInput}.${signature}`;
}

function createWireMockAuthContext(user: NHSLoginMockedUser, suffix: string): WireMockAuthContext {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const privateKeyPem = privateKey.export({ type: "pkcs1", format: "pem" }).toString();
  const publicJwk = publicKey.export({ format: "jwk" }) as {
    kty: string;
    n: string;
    e: string;
  };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + TOKEN_LIFETIME_SECONDS;
  const kid = `wiremock-key-${suffix}`;
  const sub = `wiremock-sub-${user.nhsNumber}`;
  const code = `wiremock-auth-code-${suffix}`;

  return {
    kid,
    sub,
    code,
    accessToken: signJwt(privateKeyPem, kid, {
      sub,
      iss: WIREMOCK_ISSUER,
      aud: WIREMOCK_AUDIENCE,
      exp,
      iat: now,
      scope: WIREMOCK_SCOPE,
    }),
    idToken: signJwt(privateKeyPem, kid, {
      sub,
      iss: WIREMOCK_ISSUER,
      aud: WIREMOCK_AUDIENCE,
      exp,
      iat: now,
      auth_time: now,
    }),
    refreshToken: `mock-refresh-token-${suffix}`,
    publicJwk: {
      ...publicJwk,
      kid,
      use: "sig",
      alg: "RS512",
    },
  };
}

export function createWireMockAuthUser(user: NHSLoginMockedUser, suffix: string): WireMockAuthUser {
  const authContext = createWireMockAuthContext(user, suffix);
  return {
    ...user,
    code: authContext.code,
    authContext,
  };
}

function createDefaultWireMockAuthManifest(): WireMockAuthManifest {
  return {
    createdAt: new Date().toISOString(),
    workerUsers: DEFAULT_WORKER_USERS.map((user, index) =>
      createWireMockAuthUser(user, `worker-${index}`),
    ),
    specialUsers: {
      [SpecialUserKey.UNDER_18]: createWireMockAuthUser(
        DEFAULT_SPECIAL_USERS[SpecialUserKey.UNDER_18],
        "under-18",
      ),
    },
  };
}

export function getWireMockAuthManifestPath(): string {
  return WIREMOCK_AUTH_MANIFEST_PATH;
}

export function cleanupWireMockAuthState(): void {
  fs.rmSync(WIREMOCK_AUTH_MANIFEST_PATH, { force: true });

  if (!fs.existsSync(WIREMOCK_SESSION_CACHE_DIR)) {
    return;
  }

  for (const entry of fs.readdirSync(WIREMOCK_SESSION_CACHE_DIR)) {
    if (/^WorkerUserSession\d+\.json$/.test(entry)) {
      fs.rmSync(path.join(WIREMOCK_SESSION_CACHE_DIR, entry), { force: true });
    }
  }
}

function ensureWireMockAuthManifestDirectory(): void {
  fs.mkdirSync(path.dirname(WIREMOCK_AUTH_MANIFEST_PATH), { recursive: true });
}

export function writeWireMockAuthManifest(manifest: WireMockAuthManifest): void {
  ensureWireMockAuthManifestDirectory();
  fs.writeFileSync(WIREMOCK_AUTH_MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

export function loadWireMockAuthManifest(): WireMockAuthManifest {
  const content = fs.readFileSync(WIREMOCK_AUTH_MANIFEST_PATH, "utf8");
  return JSON.parse(content) as WireMockAuthManifest;
}

export function createWireMockAuthManifest(): WireMockAuthManifest {
  const manifest = createDefaultWireMockAuthManifest();
  writeWireMockAuthManifest(manifest);
  return manifest;
}

export async function configureWireMockAuthMappings(
  wiremock: WireMockClient,
  manifest: WireMockAuthManifest,
): Promise<void> {
  await wiremock.resetAllMappings();

  const users = [...manifest.workerUsers, ...Object.values(manifest.specialUsers)];

  await wiremock.createMapping(createWireMockJwksMapping(users));

  for (const user of users) {
    await wiremock.createMapping(createWireMockAuthorizeMapping(user));
    await wiremock.createMapping(createWireMockTokenMapping(user));
  }
}

export function createWireMockJwksMapping(users: readonly WireMockAuthUser[]): WireMockMapping {
  return {
    priority: 1,
    request: {
      method: "GET",
      urlPath: "/.well-known/jwks.json",
    },
    response: {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
      jsonBody: {
        keys: users.map((user) => user.authContext.publicJwk),
      },
    },
  };
}

export function createWireMockAuthorizeMapping(user: WireMockAuthUser): WireMockMapping {
  const loginHint = user.nhsNumber ?? user.authContext.sub;

  return {
    priority: 1,
    request: {
      method: "GET",
      urlPath: "/authorize",
      queryParameters: {
        login_hint: {
          equalTo: loginHint,
        },
      },
    },
    response: {
      status: 302,
      headers: {
        Location: `{{request.query.redirect_uri}}?code=${user.code}&state={{request.query.state}}`,
      },
      transformers: ["response-template"],
    },
  };
}

export function createWireMockTokenMapping(user: WireMockAuthUser): WireMockMapping {
  return {
    priority: 1,
    request: {
      method: "POST",
      urlPath: "/token",
      headers: {
        "Content-Type": {
          contains: "application/x-www-form-urlencoded",
        },
      },
      bodyPatterns: [
        {
          contains: "grant_type=authorization_code",
        },
        {
          contains: `code=${user.code}`,
        },
      ],
    },
    response: {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
      jsonBody: {
        access_token: user.authContext.accessToken,
        id_token: user.authContext.idToken,
        refresh_token: user.authContext.refreshToken,
        token_type: "Bearer",
        expires_in: "3600",
        scope: "openid profile email phone nhs_number",
      },
    },
  };
}
