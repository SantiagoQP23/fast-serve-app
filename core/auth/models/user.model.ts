import { Person } from "@/core/common/models/person.model";

export interface User {
  id: string;
  username: string;
  person: Person;
  online: boolean;
  // restaurantRoles: RestaurantRole[];
  isActive: boolean;
}
