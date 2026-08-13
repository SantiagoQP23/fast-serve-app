import { TicketItemAction } from "../enums/ticket-item-action.enum";
import { OrderDetail } from "@/core/orders/models/order-detail.model";

export interface TicketItem {
  id: string;
  quantity: number;
  action: TicketItemAction;
  createdAt: Date;
  productName: string;
  productOptionName?: string | null;
  tagsSnapshot?: string | null;
  description?: string | null;
  price: number;
  productionAreaId?: number | null;
  productionAreaName?: string | null;
  orderDetailId: string;
  orderDetail?: OrderDetail;
}
