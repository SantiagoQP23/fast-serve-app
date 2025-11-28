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
import { UpdateOrderDetailDto } from "@/core/orders/dto/update-order.dto";
import { SocketEvent } from "@/core/common/dto/socket.dto";
import { useWebsocketEventListener } from "@/presentation/shared/hooks/useWebsocketEventListener";

export const useOrders = () => {
  const setOrders = useOrdersStore((state) => state.setOrders);
  const createOrderEmitter = useWebsocketEventEmitter<Order, CreateOrderDto>(
    OrderSocketEvent.createOrder,
    {
      onSuccess: (resp) => {
        // Alert.alert("Success", "Order created successfully");
        // router.replace("/(new-order)/order-confirmation", { withAnchor: true, params: { orderId: resp.id } });
      },
      onError: (resp) => {
        Alert.alert("Error", resp.msg);
      },
    },
  );

  const updateOrderDetailEmitter = useWebsocketEventEmitter<
    Order,
    UpdateOrderDetailDto
  >(OrderSocketEvent.updateOrderDetail, {
    onSuccess: (resp) => {
      // Alert.alert("Success", "Order detail updated successfully");
    },
    onError: (resp) => {
      Alert.alert("Error", resp.msg);
    },
  });

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
    updateOrderDetail: updateOrderDetailEmitter,
  };
};

export const useOrderCreatedListener = () => {
  const addOrder = useOrdersStore((state) => state.addOrder);
  useWebsocketEventListener(
    OrderSocketEvent.newOrder,
    ({ data, msg }: SocketEvent<Order>) => {
      Alert.alert("info", msg);
      addOrder(data);
      // dispatch(addOrder(data));

      // dispatch(setLastUpdatedOrders(new Date().toISOString()));
      //
      // dispatch(sortOrdersByDeliveryTime());
    },
  );
};

export const useOrderUpdatedListener = () => {
  const activeOrder = useOrdersStore((state) => state.activeOrder);
  const updateOrder = useOrdersStore((state) => state.updateOrder);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);

  useWebsocketEventListener<Order>(
    OrderSocketEvent.updateOrder,
    ({ data: order }: SocketEvent<Order>) => {
      updateOrder(order!);
      // Alert.alert("info", `Order #${order?.id} has been updated`);

      if (activeOrder?.id === order?.id) {
        setActiveOrder(order!);
      }

      // dispatch(setLastUpdatedOrders(new Date().toISOString()));
      //
      // dispatch(sortOrdersByDeliveryTime());
    },
  );
};
