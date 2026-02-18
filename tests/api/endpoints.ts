export const API_ENDPOINTS = {
  results: {
    base: '/result',
  },
  users: {
    base: '/users',
    list: '/users',
    createUser: '/users',
    getUser: (id: number) => `/users/${id}`,
  },
} as const;
