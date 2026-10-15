import { generateIdempotencyKey } from "@/helpers/idempotency";
import { Order } from "@/core/orders/models/order.model";
import { OrderDetail } from "@/core/orders/models/order-detail.model";
import { Ticket } from "@/core/tickets/models/ticket.model";
import { TicketItem } from "@/core/tickets/models/ticket-item.model";
import { TicketType } from "@/core/tickets/enums/ticket-type.enum";
import { TicketItemAction } from "@/core/tickets/enums/ticket-item-action.enum";

/**
 * Builds on the phone the comanda the server would create for an action, so
 * it can be printed while offline. Mirrors the backend's TicketsService
 * (buildTicketItem) and planTicketForUpdate.
 */

const buildItem = (
  detail: OrderDetail,
  action: TicketItemAction,
  quantity = detail.quantity,
): TicketItem => ({
  id: generateIdempotencyKey(),
  quantity,
  action,
  createdAt: new Date(),
  productName: detail.product?.name || "Unknown",
  productOptionName: detail.productOption?.name || null,
  tagsSnapshot: detail.tags?.length
    ? detail.tags.map((tag) => tag.name).join(", ")
    : null,
  description: detail.description || null,
  price: Number(detail.price),
  productionAreaId: detail.product?.productionArea?.id || null,
  productionAreaName: detail.product?.productionArea?.name || null,
  orderDetailId: detail.id,
});

const buildTicket = (
  order: Order,
  type: TicketType,
  items: TicketItem[],
): Ticket => ({
  id: generateIdempotencyKey(),
  type,
  printed: false,
  createdAt: new Date(),
  orderId: order.id,
  items,
});

export const buildLocalNewTicket = (order: Order) =>
  buildTicket(
    order,
    TicketType.NEW,
    order.details.map((d) => buildItem(d, TicketItemAction.ADD)),
  );

export const buildLocalAddTicket = (order: Order, details: OrderDetail[]) =>
  buildTicket(
    order,
    TicketType.ADD,
    details.map((d) => buildItem(d, TicketItemAction.ADD)),
  );

export const buildLocalCancelTicket = (order: Order, detail: OrderDetail) =>
  buildTicket(order, TicketType.CANCEL, [
    buildItem(detail, TicketItemAction.REMOVE),
  ]);

/** Ticket for an item edit, or null when quantity and variant didn't change. */
export const buildLocalUpdateTicket = (
  order: Order,
  before: OrderDetail,
  after: OrderDetail,
): Ticket | null => {
  const oldOptionId = before.productOption?.id ?? null;
  const newOptionId = after.productOption?.id ?? null;

  if (oldOptionId !== newOptionId) {
    return buildTicket(order, TicketType.UPDATE, [
      buildItem(before, TicketItemAction.REMOVE),
      buildItem(after, TicketItemAction.ADD),
    ]);
  }

  if (after.quantity > before.quantity) {
    return buildTicket(order, TicketType.ADD, [
      buildItem(after, TicketItemAction.ADD, after.quantity - before.quantity),
    ]);
  }

  if (after.quantity < before.quantity) {
    return buildTicket(order, TicketType.CANCEL, [
      buildItem(
        after,
        TicketItemAction.REMOVE,
        before.quantity - after.quantity,
      ),
    ]);
  }

  return null;
};
