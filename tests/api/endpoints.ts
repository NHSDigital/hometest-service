export const API_ENDPOINTS = {
  users: {
    base: '/users',
    getUser: (id: number) => `/users/${id}`,
    createUser: '/users',
    updateUser: (id: number) => `/users/${id}`,
    deleteUser: (id: number) => `/users/${id}`,
    list: '/users',
  },
  posts: {
    base: '/posts',
    getPost: (id: number) => `/posts/${id}`,
    createPost: '/posts',
    list: '/posts',
  },
} as const;
