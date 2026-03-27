import {
  CreateSaleDetailDto,
  CreateSaleDto,
} from "@/core/orders/dto/create-sale.dto";
import { NewOrderState } from "../store/newOrderStore";

export const mapStoreToCreateSaleDto = (
  state: NewOrderState,
): CreateSaleDto => {
  const sale: CreateSaleDto = {
    details: state.details.map((detail) => {
      const orderDetail: CreateSaleDetailDto = {
        productId: detail.product.id,
        quantity: detail.quantity,
        price: detail.price ?? detail.product.price,
      };
      return orderDetail;
    }),
  };

  return sale;
};
