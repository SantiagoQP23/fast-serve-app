import type { CreateProductionAreaDto } from "./create-production-area.dto";

export interface UpdateProductionAreaDto extends CreateProductionAreaDto {
  id: number;
}
