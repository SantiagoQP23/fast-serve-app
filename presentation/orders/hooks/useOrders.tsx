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
import {
  AddOrderDetailToOrderDto,
  DeleteOrderDetailDto,
  UpdateOrderDetailDto,
  UpdateOrderDto,
} from "@/core/orders/dto/update-order.dto";
import { SocketEvent } from "@/core/common/dto/socket.dto";
import { useWebsocketEventListener } from "@/presentation/shared/hooks/useWebsocketEventListener";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

export const useOrders = () => {
  const setOrders = useOrdersStore((state) => state.setOrders);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const { currentRestaurant } = useAuthStore((state) => state);
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

  const updateOrderEmitter = useWebsocketEventEmitter<Order, UpdateOrderDto>(
    OrderSocketEvent.updateOrder,
    {
      onSuccess: (resp) => {
        if (resp.data) setActiveOrder(resp.data!);
      },
      onError: (resp) => {},
    },
  );

  const updateOrderDetailEmitter = useWebsocketEventEmitter<
    Order,
    UpdateOrderDetailDto
  >(OrderSocketEvent.updateOrderDetail, {
    onSuccess: (resp) => {
      if (resp.data) setActiveOrder(resp.data!);
      // Alert.alert("Success", "Order detail updated successfully");
    },
    onError: (resp) => {
      Alert.alert("Error", resp.msg);
    },
  });

  const useOrderDetailToOrderEmitter = useWebsocketEventEmitter<
    Order,
    AddOrderDetailToOrderDto
  >(OrderSocketEvent.addOrderDetail, {
    onSuccess: (resp) => {
      if (resp.data) setActiveOrder(resp.data!);
    },
    onError: (resp) => {
      Alert.alert("Error", resp.msg);
    },
  });

  const deleteOrderEmitter = useWebsocketEventEmitter<Order, string>(
    OrderSocketEvent.deleteOrder,
    {
      onSuccess: (resp) => {},
      onError: (resp) => {
        Alert.alert("Error", resp.msg);
      },
    },
  );

  const removeOrderDetailEmitter = useWebsocketEventEmitter<
    Order,
    DeleteOrderDetailDto
  >(OrderSocketEvent.deleteOrderDetail, {
    onSuccess: (resp) => {},
    onError: (resp) => {
      Alert.alert("Error", resp.msg);
    },
  });

  const activeOrdersQuery = useQuery({
    queryKey: ["activeOrders", currentRestaurant?.id],
    queryFn: async () => OrdersService.getActiveOrders(),
    enabled: !!currentRestaurant?.id,
    staleTime: 0, // Always consider data stale to ensure refetch on restaurant change
  });

  const createOrder = () => {
    const newOrder = useNewOrderStore();
    const data = mapStoreToCreateOrderDto(newOrder);
    return createOrderEmitter.mutate(data);
  };
  useEffect(() => {
    // Always sync the query data with the store, even if it's empty
    if (activeOrdersQuery.data !== undefined) {
      console.log(
        `[useOrders] Setting active orders for restaurant ${currentRestaurant?.id}:`,
        activeOrdersQuery.data.length,
      );
      setOrders(activeOrdersQuery.data);
    }
  }, [activeOrdersQuery.data, setOrders, currentRestaurant?.id]);

  return {
    createOrder: createOrderEmitter,
    activeOrdersQuery,
    updateOrderDetail: updateOrderDetailEmitter,
    addOrderDetailToOrder: useOrderDetailToOrderEmitter,
    updateOrder: updateOrderEmitter,
    removeOrderDetail: removeOrderDetailEmitter,
    deleteOrder: deleteOrderEmitter,
  };
};

export const useOrderCreatedListener = () => {
  const addOrder = useOrdersStore((state) => state.addOrder);
  useWebsocketEventListener(
    OrderSocketEvent.newOrder,
    ({ data, msg }: SocketEvent<Order>) => {
      // Alert.alert("info", msg);
      addOrder(data);
      // dispatch(addOrder(data));

      // dispatch(setLastUpdatedOrders(new Date().toISOString()));
      //
      // dispatch(sortOrdersByDeliveryTime());
    },
  );
};

export const useOrderUpdatedListener = () => {
  const updateOrder = useOrdersStore((state) => state.updateOrder);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);

  useWebsocketEventListener<Order>(
    OrderSocketEvent.updateOrder,
    ({ data: order }: SocketEvent<Order>) => {
      console.log("Received order update for order:", order?.id);
      
      // Update the order in the list
      updateOrder(order!);
      
      // Get current active order state at the time of the event
      const currentActiveOrder = useOrdersStore.getState().activeOrder;
      console.log("activeOrder:", currentActiveOrder?.id);

      if (currentActiveOrder?.id === order?.id) {
        console.log("Updating active order:", order.id);
        setActiveOrder(order!);
      }
    },
  );
};

export const useOrderDeletedListener = () => {
  const deleteOrder = useOrdersStore((state) => state.deleteOrder);
  useWebsocketEventListener(
    OrderSocketEvent.deleteOrder,
    ({ data }: SocketEvent<Order>) => {
      if (data) deleteOrder(data.id);
    },
  );
};
