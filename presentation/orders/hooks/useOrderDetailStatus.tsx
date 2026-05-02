import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import { OrderDetailStatus } from "@/core/orders/models/order-detail.model";
import { useOrderStatus } from "./useOrderStatus";

const detailStatusToOrderStatus: Record<OrderDetailStatus, OrderStatus> = {
  [OrderDetailStatus.PENDING]: OrderStatus.PENDING,
  [OrderDetailStatus.IN_PROGRESS]: OrderStatus.IN_PROGRESS,
  [OrderDetailStatus.READY]: OrderStatus.READY,
  [OrderDetailStatus.DELIVERED]: OrderStatus.DELIVERED,
  [OrderDetailStatus.CANCELLED]: OrderStatus.CANCELLED,
};

export function useOrderDetailStatus(status: OrderDetailStatus) {
  return useOrderStatus(detailStatusToOrderStatus[status]);
}
