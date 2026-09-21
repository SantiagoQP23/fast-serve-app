export interface CreateProductionAreaDto {
  name: string;
  description?: string;
  printerIds?: string[];
  isActive?: boolean;
}
