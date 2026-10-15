import { useOutboxStore } from "../store/useOutboxStore";

/**
 * Whether an order has actions this phone hasn't sent yet: "failed" when the
 * server rejected one of them, "pending" while they wait, null otherwise.
 */
export const useOrderSyncState = (orderId?: string) =>
  useOutboxStore((state) => {
    if (!orderId) return null;
    const ops = state.operations.filter((op) => op.orderId === orderId);
    if (ops.length === 0) return null;
    return ops.some((op) => op.status === "failed") ? "failed" : "pending";
  });

/** Unsent actions of a restaurant, and how many of them were rejected. */
export const useOutboxCounts = (restaurantId?: string) => {
  const total = useOutboxStore(
    (state) =>
      state.operations.filter((op) => op.restaurantId === restaurantId).length,
  );
  const failed = useOutboxStore(
    (state) =>
      state.operations.filter(
        (op) => op.restaurantId === restaurantId && op.status === "failed",
      ).length,
  );
  return { total, failed };
};
