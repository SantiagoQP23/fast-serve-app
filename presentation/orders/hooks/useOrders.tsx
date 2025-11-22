import { CreateOrderDto } from "@/core/orders/dto/create-order.dto";
import { OrderSocketEvent } from "@/core/orders/enums/socket-events.enum";
import { Order } from "@/core/orders/models/order.model";
import { useWebsocketEventEmitter } from "@/presentation/shared/hooks/useWebsocketEventEmitter";
import { router } from "expo-router";
import { Alert } from "react-native";
import { mapStoreToCreateOrderDto } from "../mappers/createOrder.mapper";
import { useNewOrderStore } from "../store/newOrderStore";
import { useQuery } from "@tanstack/react-query";
import { OrdersService } from "@/core/orders/services/orders.service";
import { useOrdersStore } from "../store/useOrdersStore";
import { useEffect } from "react";

export const useOrders = () => {
  const setOrders = useOrdersStore((state) => state.setOrders);
  const createOrderEmitter = useWebsocketEventEmitter<Order, CreateOrderDto>(
    OrderSocketEvent.createOrder,
    {
      onSuccess: (resp) => {
        Alert.alert("Success", "Order created successfully");
        // router.replace("/(new-order)/order-confirmation", { withAnchor: true, params: { orderId: resp.id } });
      },
      onError: (resp) => {
        Alert.alert("Error", resp.msg);
      },
    },
  );

  const activeOrdersQuery = useQuery({
    queryKey: ["activeOrders"],
    queryFn: async () => OrdersService.getActiveOrders(),
  });

  const createOrder = () => {
    const newOrder = useNewOrderStore();
    const data = mapStoreToCreateOrderDto(newOrder);
    return createOrderEmitter.mutate(data);
  };
  useEffect(() => {
    if (activeOrdersQuery.data) {
      console.log("Setting active orders:", activeOrdersQuery.data.length);
      setOrders(activeOrdersQuery.data);
    }
  }, [activeOrdersQuery.data]);

  return {
    createOrder: createOrderEmitter,
    activeOrdersQuery,
  };
};
