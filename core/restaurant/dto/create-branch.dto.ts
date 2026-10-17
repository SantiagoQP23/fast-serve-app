import { Roles } from "@/core/auth/models/user.model";

export type BranchRole = Exclude<Roles, Roles.OWNER>;

export interface CreateBranchDto {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  /** Mesas por zona; areaId null = "Sin zona". */
  tables: { areaId: string | null; quantity: number }[];
  users: { userId: string; role: BranchRole }[];
}

export interface NextBranchNameDto {
  name: string;
  number: number;
}
