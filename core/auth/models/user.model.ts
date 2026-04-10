import { Person } from "@/core/common/models/person.model";
import { Restaurant } from "@/core/common/models/restaurant.model";

export interface IRole {
  id: number;
  name: string;
  description: string;
}

export enum Roles {
  ADMIN = "admin",
  COOK = "cook",
  WAITER = "waiter",
  CASHIER = "cashier",
}

export interface RestaurantRole {
  id: number;
  restaurant: Restaurant;
  role: IRole;
}

export interface User {
  id: string;
  username: string;
  person: Person;
  online: boolean;
  role: IRole;
  restaurantRoles: RestaurantRole[];
  isActive: boolean;
}
