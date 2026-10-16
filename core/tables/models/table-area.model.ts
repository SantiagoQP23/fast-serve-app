/** Zona del restaurante (Salón, Terraza...) que agrupa mesas. */
export interface TableArea {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
}
