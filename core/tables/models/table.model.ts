export interface Table {
  id: string;
  name: string;
  description?: string;
  chairs?: number;
  isAvailable: boolean;
  order?: number;
  isActive?: boolean;
}
