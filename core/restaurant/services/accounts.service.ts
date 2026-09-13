import { restaurantApi } from "@/core/api/restaurantApi";
import { Account } from "../models/account.model";
import type { CreateAccountDto } from "@/presentation/restaurant/interfaces/dto/create-account.dto";
import type { UpdateAccountDto } from "@/presentation/restaurant/interfaces/dto/update-account.dto";

export class AccountsService {
  static async getAccounts(): Promise<Account[]> {
    const resp = await restaurantApi.get<Account[]>("/accounts");
    return resp.data;
  }

  static async create(data: CreateAccountDto): Promise<Account> {
    const resp = await restaurantApi.post<Account>("/accounts", data);
    return resp.data;
  }

  static async update(id: number, data: UpdateAccountDto): Promise<Account> {
    const resp = await restaurantApi.patch<Account>(`/accounts/${id}`, data);
    return resp.data;
  }

  static async remove(id: number): Promise<void> {
    await restaurantApi.delete(`/accounts/${id}`);
  }
}
