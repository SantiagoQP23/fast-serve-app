import { Product } from "./product.model";

// export interface CategorySection {
//   id: string;
//   name: string;
// }

export interface Category {
  id: string;
  name: string;
  products: Product[];
  sectionId: string;
  // section: CategorySection;
  isActive: boolean;
  isPublic: boolean;
}
