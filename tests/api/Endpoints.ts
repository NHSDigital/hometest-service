export const API_ENDPOINTS = {
  results: {
    base: "/result",
    get: "/results",
  },
  order: {
    create: "/order",
    get: "/get-order",
  },
  orderStatus: {
    update: "/test-order/status",
  },
} as const;
