export const ROUTES = {
  AUTH: {
    LOGIN: "/auth/login",
  },
  APP: {
    MY_ORDERS: "/(app)/(tabs)/(orders-module)/my-orders",
  },
  NO_RESTAURANT: "/no-restaurant",
  HOME: "/(",
  ORDERS: "/orders",
  BILLS: "/bills",
  PROFILE: "/profile",
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];
