import { type Options } from '@middy/http-cors';

const allowOrigin =
  process.env.ALLOW_ORIGIN ?? 'http://localhost:3000';

export const defaultCorsOptions: Options = {
  credentials: true,
  headers: '*',
  origin: allowOrigin,
  methods: 'GET'
};
