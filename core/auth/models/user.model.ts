import { Person } from "@/core/common/models/person.model";
import { Restaurant } from "@/core/common/models/restaurant.model";

export enum Roles {
  ADMIN = "admin",
  OWNER = "owner",
  COOK = "cook",
  WAITER = "waiter",
  CASHIER = "cashier",
}

export interface IRole {
  id: number;
  name: Roles;
  description: string;
}

export function isValidRole(role: Roles | undefined, allowedRoles: Roles[]): boolean {
  return !!role && allowedRoles.includes(role);
}

const ADMIN_LEVEL_ROLES = [Roles.ADMIN, Roles.OWNER];

export function isAdminLevelRole(role?: Roles): boolean {
  return isValidRole(role, ADMIN_LEVEL_ROLES);
}

export interface RestaurantRole {
  id: number;
  restaurant: Restaurant;
  role: IRole;
}

export type AuthProvider = "local" | "google";

export interface User {
  id: string;
  username: string;
  person: Person;
  online: boolean;
  role?: IRole;
  restaurantRoles: RestaurantRole[];
  isActive: boolean;
  authProvider?: AuthProvider[];
  googleId?: string;
  email: string;
  emailVerifiedAt?: Date;
}
