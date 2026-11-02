import { TicketItemAction } from "../enums/ticket-item-action.enum";
import { OrderDetail } from "@/core/orders/models/order-detail.model";
import type { OrderDetailModifier } from "@/core/menu/models/customization.model";

export interface TicketItem {
  id: string;
  quantity: number;
  action: TicketItemAction;
  createdAt: Date;
  productName: string;
  productOptionName?: string | null;
  tagsSnapshot?: string | null;
  description?: string | null;
  /** Frozen customizations, printed under the product. */
  modifiersSnapshot?: OrderDetailModifier[] | null;
  price: number;
  productionAreaId?: number | null;
  productionAreaName?: string | null;
  orderDetailId: string;
  orderDetail?: OrderDetail;
}
