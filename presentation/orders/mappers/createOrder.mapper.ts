import {
  CreateOrderDetailDto,
  CreateOrderDto,
} from "@/core/orders/dto/create-order.dto";
import { NewOrderState } from "../store/newOrderStore";
import { OrderType } from "@/core/orders/enums/order-type.enum";

export const mapStoreToCreateOrderDto = (
  state: NewOrderState,
): CreateOrderDto => {
  const order: CreateOrderDto = {
    tableId: state.table?.id || "",
    details: state.details.map((detail) => {
      const orderDetail: CreateOrderDetailDto = {
        productId: detail.product.id,
        quantity: detail.quantity,
        description: detail.description,
        price: detail.product.price,
      };
      return orderDetail;
    }),
    notes: state.notes,
    people: state.people,
    typeOrder: state.orderType,
  };

  if (state.orderType === OrderType.TAKE_AWAY) delete order.tableId;

  return order;
};
