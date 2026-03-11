import { type Options } from '@middy/http-cors';

const cookieAccessControlAllowOrigin =
  process.env.COOKIE_ACCESS_CONTROL_ALLOW_ORIGIN ?? 'http://localhost:3000';

export const defaultCorsOptions: Options = {
  // credentials: true is required for the browser to accept and send Set-Cookie
  // headers cross-origin. When credentials is true, the origin must be an exact
  // domain — a wildcard '*' is rejected by all browsers per the CORS spec.
  credentials: true,
  headers: '*',
  origin: cookieAccessControlAllowOrigin,
  methods: '*'
};
