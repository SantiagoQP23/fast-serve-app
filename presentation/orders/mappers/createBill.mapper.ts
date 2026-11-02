import {
  CreateSaleDetailDto,
  CreateSaleDto,
} from "@/core/orders/dto/create-sale.dto";
import { NewOrderState } from "../store/newOrderStore";
import { lineCustomization } from "@/core/menu/models/customization.model";

export const mapStoreToCreateSaleDto = (
  state: NewOrderState,
): CreateSaleDto => {
  const sale: CreateSaleDto = {
    idempotencyKey: state.idempotencyKey,
    details: state.details.map((detail) => {
      const orderDetail: CreateSaleDetailDto = {
        productId: detail.product.id,
        quantity: detail.quantity,
        price: detail.price ?? detail.productOption.price,
        productOptionId: detail.productOption.id,
        customization: lineCustomization(detail),
      };
      return orderDetail;
    }),
  };

  return sale;
};
