export interface CreateTableDto {
  name: string;
  description: string;
  chairs: number;
  areaId?: string | null;
}
