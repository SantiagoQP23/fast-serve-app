export const ROUTES = {
  LOGIN: "/login",
  HOME: "/",
  ORDERS: "/orders",
  BILLS: "/bills",
  PROFILE: "/profile",
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];
