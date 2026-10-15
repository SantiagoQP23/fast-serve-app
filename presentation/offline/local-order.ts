import type { TFunction } from "@/core/i18n/hooks/useTranslation";
import { User } from "@/core/auth/models/user.model";
import { Product } from "@/core/menu/models/product.model";
import { ProductOption } from "@/core/menu/models/product-optionl.model";
import { Table } from "@/core/tables/models/table.model";
import { Order } from "@/core/orders/models/order.model";
import {
  OrderDetail,
  OrderDetailStatus,
} from "@/core/orders/models/order-detail.model";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { OrderPaymentStatus } from "@/core/orders/enums/order-payment-status.enum";
import {
  UpdateOrderDetailDto,
  UpdateOrderDetailsDto,
  UpdateOrderDto,
} from "@/core/orders/dto/update-order.dto";

/**
 * Builds and edits orders on the phone while their actions wait in the
 * outbox. The server's version replaces them once the actions are sent and
 * the app syncs, so this only needs to look right, not match the server's
 * rules exactly.
 */

/** Orders created offline have no number until the server assigns one. */
export const isOrderNumberPending = (order: Pick<Order, "num">) => !order.num;

/** "Pedido N° 12", or "Pedido (sin número)" while the order isn't synced. */
export const orderNumberText = (
  order: Pick<Order, "num">,
  t: TFunction,
) =>
  isOrderNumberPending(order)
    ? t("orders:details.orderNumberPending")
    : t("orders:details.orderNumber", { num: order.num });

export interface LocalDetailInput {
  id: string;
  product: Product;
  productOption?: ProductOption;
  quantity: number;
  price?: number;
  description?: string;
  tagIds?: string[];
  typeOrderDetail?: OrderType;
}

export const buildLocalDetail = (
  input: LocalDetailInput,
  user?: User,
): OrderDetail => {
  const price = input.price ?? input.productOption?.price ?? 0;
  const now = new Date().toISOString();

  return {
    id: input.id,
    quantity: input.quantity,
    qtyDelivered: 0,
    readyQuantity: 0,
    qtyPaid: 0,
    status: OrderDetailStatus.PENDING,
    amount: price * input.quantity,
    price,
    description: input.description ?? "",
    createdAt: now,
    updatedAt: now,
    product: input.product,
    productOption: input.productOption,
    isActive: true,
    tags: (input.product.tags ?? []).filter((tag) =>
      input.tagIds?.includes(tag.id),
    ),
    createdBy: user,
    typeOrderDetail: input.typeOrderDetail ?? OrderType.IN_PLACE,
  };
};

const isCounted = (detail: OrderDetail) =>
  detail.isActive !== false && detail.status !== OrderDetailStatus.CANCELLED;

/** Recomputes the total and a plausible status after the items changed. */
export const withDetails = (order: Order, details: OrderDetail[]): Order => {
  const counted = details.filter(isCounted);
  const total = counted.reduce((acc, d) => acc + Number(d.amount), 0);
  const allDelivered =
    counted.length > 0 &&
    counted.every((d) => d.status === OrderDetailStatus.DELIVERED);

  let status = order.status;
  if (allDelivered) status = OrderStatus.DELIVERED;
  else if (order.status === OrderStatus.DELIVERED) status = OrderStatus.PENDING;

  return { ...order, details, total, status, updatedAt: new Date() };
};

export const buildLocalOrder = (input: {
  id: string;
  type: OrderType;
  people: number;
  table?: Table;
  notes?: string;
  deliveryTime?: Date;
  details: OrderDetail[];
  user?: User;
}): Order => {
  const now = new Date();

  return withDetails(
    {
      id: input.id,
      num: 0,
      notes: input.notes ?? "",
      deliveryTime:
        input.deliveryTime ?? new Date(now.getTime() + 15 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
      details: [],
      isPaid: false,
      people: input.people,
      status: OrderStatus.PENDING,
      table: input.type === OrderType.IN_PLACE ? input.table : undefined,
      total: 0,
      type: input.type,
      user: input.user,
      isClosed: false,
      paymentStatus: OrderPaymentStatus.UNPAID,
      bills: [],
      tickets: [],
    },
    input.details,
  );
};

export const addLocalDetails = (order: Order, details: OrderDetail[]) =>
  withDetails(order, [...order.details, ...details]);

export const applyLocalDetailUpdate = (
  order: Order,
  dto: UpdateOrderDetailDto | UpdateOrderDetailsDto["details"][number],
): Order =>
  withDetails(
    order,
    order.details.map((detail) => {
      if (detail.id !== dto.id) return detail;

      const next: OrderDetail = { ...detail };
      if (dto.quantity !== undefined) next.quantity = dto.quantity;
      if (dto.qtyDelivered !== undefined) next.qtyDelivered = dto.qtyDelivered;
      if (dto.description !== undefined) next.description = dto.description;
      if (dto.status !== undefined) next.status = dto.status;

      if ("price" in dto && dto.price !== undefined) next.price = dto.price;
      if ("typeOrderDetail" in dto && dto.typeOrderDetail)
        next.typeOrderDetail = dto.typeOrderDetail;
      if ("productOptionId" in dto && dto.productOptionId !== undefined) {
        next.productOption =
          detail.product.options?.find((o) => o.id === dto.productOptionId) ??
          detail.productOption;
      }
      if ("tagIds" in dto && dto.tagIds) {
        next.tags = (detail.product.tags ?? []).filter((tag) =>
          dto.tagIds!.includes(tag.id),
        );
      }

      // Same rules the server applies to the item's status.
      if (dto.status === undefined) {
        if (next.qtyDelivered >= next.quantity)
          next.status = OrderDetailStatus.DELIVERED;
        else if (
          next.qtyDelivered < next.quantity &&
          detail.status === OrderDetailStatus.DELIVERED
        )
          next.status = OrderDetailStatus.PENDING;
      }

      next.amount = Number(next.price) * next.quantity;
      next.updatedAt = new Date().toISOString();
      return next;
    }),
  );

export const applyLocalDetailRemoval = (order: Order, detailId: string) =>
  withDetails(
    order,
    order.details.map((detail) =>
      detail.id === detailId
        ? { ...detail, status: OrderDetailStatus.CANCELLED }
        : detail,
    ),
  );

export const applyLocalOrderUpdate = (
  order: Order,
  dto: UpdateOrderDto,
  tables: Table[],
): Order => {
  const next: Order = { ...order, updatedAt: new Date() };

  if (dto.people !== undefined) next.people = dto.people;
  if (dto.notes !== undefined) next.notes = dto.notes;
  if (dto.deliveryTime !== undefined)
    next.deliveryTime = new Date(dto.deliveryTime);
  if (dto.typeOrder !== undefined) {
    next.type = dto.typeOrder;
    if (dto.typeOrder === OrderType.TAKE_AWAY) next.table = undefined;
  }
  if (dto.tableId) {
    next.table = tables.find((table) => table.id === dto.tableId) ?? next.table;
  }

  return next;
};
