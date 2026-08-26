import { restaurantApi } from "@/core/api/restaurantApi";
import { Printer } from "@/core/common/models/printer.model";
import type { CreatePrinterDto } from "../interfaces/dto/create-printer.dto";
import type { UpdatePrinterDto } from "../interfaces/dto/update-printer.dto";

export class PrintersService {
  static getAll = async (): Promise<Printer[]> => {
    const resp = await restaurantApi.get<Printer[]>("/printers");

    return resp.data;
  };

  static create = async (data: CreatePrinterDto): Promise<Printer> => {
    const resp = await restaurantApi.post<Printer>("/printers", data);
    return resp.data;
  };

  static update = async ({
    id,
    ...data
  }: UpdatePrinterDto): Promise<Printer> => {
    const resp = await restaurantApi.patch<Printer>(`/printers/${id}`, data);
    return resp.data;
  };

  static delete = async (id: string): Promise<void> => {
    await restaurantApi.delete(`/printers/${id}`);
  };
}
