import { ProductOption } from "@/core/menu/models/product-optionl.model";
import { Product } from "@/core/menu/models/product.model";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import type {
  CustomizationSelection,
  OrderDetailModifier,
} from "@/core/menu/models/customization.model";

export interface NewOrderDetail {
  id?: string;
  quantity: number;
  product: Product;
  description?: string;
  price?: number;
  tagIds?: string[];
  productOption: ProductOption;
  typeOrderDetail: OrderType;
  /** What was picked; absent for products without customization. */
  customization?: CustomizationSelection;
  /** Frozen rows for the selection (shown, printed, sent offline). */
  modifiers?: OrderDetailModifier[];
  /** `price` was typed by hand: the server keeps it. */
  customPrice?: boolean;
}
