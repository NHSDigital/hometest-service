export const API_ENDPOINTS = {
  results: {
    base: '/result',
    get: '/results',
  },
  users: {
    base: '/users',
    list: '/users',
    createUser: '/users',
    getUser: (id: number) => `/users/${id}`,
  },
  order: {
    create: '/order',
    get: '/order',
  },
} as const;
