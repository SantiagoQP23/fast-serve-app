import { Category } from "./category.model";
import { Product } from "./product.model";
import { Section } from "./section.model";

export interface Menu {
  sections: Section[];
  categories: Category[];
  products: Product[];
}
