export interface Table {
  id: string;
  name: string;
  description?: string;
  chairs?: number;
  isAvailable: boolean;
  order?: number;
  isActive?: boolean;
  /** Zona de la mesa; null = "Sin zona". `order` es su posición dentro de ella. */
  areaId?: string | null;
}
