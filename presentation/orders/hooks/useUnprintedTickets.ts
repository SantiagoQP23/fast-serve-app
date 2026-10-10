import { useMemo } from "react";
import { Ticket } from "@/core/tickets/models/ticket.model";
import { Order } from "@/core/orders/models/order.model";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useUnprintedTicketsStore } from "@/presentation/orders/store/useUnprintedTicketsStore";

export interface UnprintedTicket {
  ticket: Ticket;
  order: Order;
}

/**
 * Unprinted, unskipped tickets of the active orders, oldest first. Tickets of
 * orders that are no longer active drop out on their own.
 */
export const useUnprintedTickets = (): UnprintedTicket[] => {
  const tickets = useUnprintedTicketsStore((state) => state.tickets);
  const orders = useOrdersStore((state) => state.orders);

  return useMemo(() => {
    const ordersById = new Map(
      orders
        .filter((order) => !order.isClosed)
        .map((order) => [order.id, order]),
    );

    return tickets
      .filter((ticket) => ordersById.has(ticket.orderId))
      .map((ticket) => ({ ticket, order: ordersById.get(ticket.orderId)! }))
      .sort(
        (a, b) =>
          new Date(a.ticket.createdAt).getTime() -
          new Date(b.ticket.createdAt).getTime(),
      );
  }, [tickets, orders]);
};
