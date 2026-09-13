import { AccountType } from "@/core/restaurant/models/account.model";

export interface CreateAccountDto {
  name: string;
  description: string;
  num?: string;
  type: AccountType;
}
