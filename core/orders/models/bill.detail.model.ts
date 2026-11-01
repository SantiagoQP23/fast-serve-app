import { Product } from "@/core/menu/models/product.model";
import { Bill } from "./bill.model";
import { OrderDetail } from "./order-detail.model";
import { ProductOption } from "@/core/menu/models/product-optionl.model";
import type { OrderDetailModifier } from "@/core/menu/models/customization.model";

export interface BillDetail {
  id: number;
  quantity: number;
  price: number;
  total: number;
  bill: Bill;
  orderDetail?: OrderDetail;
  product?: Product;
  productOption: ProductOption;
  /** Direct-sale lines: their own frozen customization. */
  modifiers?: OrderDetailModifier[];
  createdAt: Date;
  updatedAt: Date;
}
