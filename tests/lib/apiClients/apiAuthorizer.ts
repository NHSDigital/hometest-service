import * as fs from 'fs';
import { test } from '../../fixtures/commonFixture';
import type { APIResponse } from '@playwright/test';
import { UserManagerFactory } from '../users/UserManagerFactory';

const userManager = new UserManagerFactory().getUserManager();

interface AuthJson {
  cookies: Cookie[];
  origins: string[];
}

interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: string;
}

function getAuthToken(): string {
  let authCookie: string = '';

  const fileName: string = userManager.getWorkerUserSessionFilePath(
    test.info().parallelIndex
  );
  const authJson = JSON.parse(fs.readFileSync(fileName, 'utf8')) as AuthJson;

  authJson.cookies.forEach((element: { name: string; value: string }) => {
    if (element.name === 'auth') authCookie = element.value;
  });

  console.log(`Auth token : ${authCookie}`);
  return authCookie.toString();
}

export function extractAuthCookies(
  loginResponse: APIResponse
): Record<string, string> {
  const cookieMap: Record<string, string> = {};
  const setCookieHeaders = loginResponse
    .headersArray()
    .filter((h) => h.name.toLowerCase() === 'set-cookie')
    .map((h) => h.value);

  for (const header of setCookieHeaders) {
    const [cookiePart] = header.split(';');
    const [name, value] = cookiePart.trim().split('=');
    cookieMap[name] = value;
  }
  return cookieMap;
}

export default getAuthToken;
