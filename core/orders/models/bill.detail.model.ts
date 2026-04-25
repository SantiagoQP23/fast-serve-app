import { Product } from "@/core/menu/models/product.model";
import { Bill } from "./bill.model";
import { OrderDetail } from "./order-detail.model";
import { ProductOption } from "@/core/menu/models/product-optionl.model";

export interface BillDetail {
  id: number;
  quantity: number;
  price: number;
  total: number;
  bill: Bill;
  orderDetail?: OrderDetail;
  product?: Product;
  productOption: ProductOption;
  createdAt: Date;
  updatedAt: Date;
}
