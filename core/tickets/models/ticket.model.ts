import { TicketItem } from "./ticket-item.model";
import { TicketType } from "../enums/ticket-type.enum";
import { Order } from "@/core/orders/models/order.model";

export interface Ticket {
  id: string;
  type: TicketType;
  printed: boolean;
  skipped?: boolean;
  createdAt: Date;
  orderId: string;
  order?: Order;
  items: TicketItem[];
}
