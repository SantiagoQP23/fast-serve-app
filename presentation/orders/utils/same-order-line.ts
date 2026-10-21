import { NewOrderDetail } from "@/core/orders/dto/new-order-detail.dto";

const sameTags = (a: string[] = [], b: string[] = []) =>
  a.length === b.length && a.every((id) => b.includes(id));

/**
 * Two cart lines that would print as the same ticket line: same variant,
 * price, order type, tags and note. Adding one onto the other should raise
 * its quantity instead of creating a duplicate row.
 */
export const isSameOrderLine = (
  a: Omit<NewOrderDetail, "id">,
  b: Omit<NewOrderDetail, "id">,
) =>
  a.productOption?.id === b.productOption?.id &&
  (a.price ?? a.productOption?.price) === (b.price ?? b.productOption?.price) &&
  a.typeOrderDetail === b.typeOrderDetail &&
  (a.description ?? "").trim() === (b.description ?? "").trim() &&
  sameTags(a.tagIds, b.tagIds);
