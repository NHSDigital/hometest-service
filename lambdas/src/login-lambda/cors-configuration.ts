import { type Options } from '@middy/http-cors';

const cookieAccessControlAllowOrigin =
  process.env.COOKIE_ACCESS_CONTROL_ALLOW_ORIGIN ?? 'http://localhost:3000';

export const defaultCorsOptions: Options = {
  credentials: true,
  headers: '*',
  origin: cookieAccessControlAllowOrigin,
  methods: '*'
};
