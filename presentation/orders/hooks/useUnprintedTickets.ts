import { useMemo } from "react";
import { Ticket } from "@/core/tickets/models/ticket.model";
import { Order } from "@/core/orders/models/order.model";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useUnprintedTicketsStore } from "@/presentation/orders/store/useUnprintedTicketsStore";
import { useProductionAreasStore } from "@/presentation/production-areas/store/useProductionAreasStore";
import { isPrintableArea } from "@/presentation/production-areas/utils/printable-area.util";

export interface UnprintedTicket {
  ticket: Ticket;
  order: Order;
}

/**
 * Unprinted, unskipped tickets of the active orders, oldest first. Tickets of
 * orders that are no longer active drop out on their own, and so do tickets
 * with no item in an area that can print (`isPrintableArea`).
 */
export const useUnprintedTickets = (): UnprintedTicket[] => {
  const tickets = useUnprintedTicketsStore((state) => state.tickets);
  const orders = useOrdersStore((state) => state.orders);
  const productionAreas = useProductionAreasStore(
    (state) => state.productionAreas,
  );

  return useMemo(() => {
    const printableAreaIds = new Set(
      productionAreas.filter(isPrintableArea).map((area) => area.id),
    );

    const ordersById = new Map(
      orders
        .filter((order) => !order.isClosed)
        .map((order) => [order.id, order]),
    );

    return tickets
      .filter(
        (ticket) =>
          ordersById.has(ticket.orderId) &&
          ticket.items.some(
            (item) =>
              item.productionAreaId != null &&
              printableAreaIds.has(item.productionAreaId),
          ),
      )
      .map((ticket) => ({ ticket, order: ordersById.get(ticket.orderId)! }))
      .sort(
        (a, b) =>
          new Date(a.ticket.createdAt).getTime() -
          new Date(b.ticket.createdAt).getTime(),
      );
  }, [tickets, orders, productionAreas]);
};
