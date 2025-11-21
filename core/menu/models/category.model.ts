import { Product } from "./product.model";

export interface CategorySection {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  products: Product[];
  section: CategorySection;
  isActive: boolean;
  isPublic: boolean;
}
