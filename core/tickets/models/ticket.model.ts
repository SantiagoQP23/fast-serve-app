import { TicketItem } from "./ticket-item.model";
import { TicketType } from "../enums/ticket-type.enum";
import { Order } from "@/core/orders/models/order.model";

/** Just enough of a user to show their name. */
export interface TicketUser {
  id: string;
  person?: { firstName: string; lastName?: string } | null;
}

export interface Ticket {
  id: string;
  type: TicketType;
  printed: boolean;
  skipped?: boolean;
  createdAt: Date;
  orderId: string;
  order?: Order;
  items: TicketItem[];
  /** Who made the change (missing on old tickets). */
  createdBy?: TicketUser | null;
  /** Owner/admin who authorized a removal. */
  authorizedBy?: TicketUser | null;
}
