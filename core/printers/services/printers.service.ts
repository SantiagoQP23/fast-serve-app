import { restaurantApi } from "@/core/api/restaurantApi";
import { Printer } from "@/core/common/models/printer.model";

export class PrintersService {
  static getAll = async (): Promise<Printer[]> => {
    const resp = await restaurantApi.get<Printer[]>("/printers");

    return resp.data;
  };
}
