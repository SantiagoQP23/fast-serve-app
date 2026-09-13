import type { CreateTableDto } from "./create-table.dto";

export interface UpdateTableDto extends Partial<CreateTableDto> {
  id: string;
  isActive?: boolean;
  isAvailable?: boolean;
}
