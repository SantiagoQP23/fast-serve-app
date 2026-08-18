import { CreateOrderDto } from "@/core/orders/dto/create-order.dto";
import { OrderSocketEvent } from "@/core/orders/enums/socket-events.enum";
import { Order } from "@/core/orders/models/order.model";
import { useWebsocketEventEmitter } from "@/presentation/shared/hooks/useWebsocketEventEmitter";
import { Alert } from "react-native";
import { useOrdersStore } from "../store/useOrdersStore";
import {
  AddOrderDetailToOrderDto,
  AddOrderDetailsDto,
  DeleteOrderDetailDto,
  UpdateOrderResp,
  UpdateOrderDetailsDto,
  UpdateOrderDetailDto,
  UpdateOrderDto,
} from "@/core/orders/dto/update-order.dto";
import { SocketEvent } from "@/core/common/dto/socket.dto";
import { useWebsocketEventListener } from "@/presentation/shared/hooks/useWebsocketEventListener";
import { usePrintComanda } from "./usePrintComanda";

export const useOrders = () => {
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const updateOrder = useOrdersStore((state) => state.updateOrder);
  const { printComanda } = usePrintComanda();

  const createOrderEmitter = useWebsocketEventEmitter<Order, CreateOrderDto>(
    OrderSocketEvent.createOrder,
    {
      onSuccess: (resp) => {
        const order = resp.data;
        if (order) {
          setActiveOrder(order);
          if (order.tickets) {
            for (const ticket of order?.tickets) {
              printComanda(order, ticket);
            }
          }
        }
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
      if (resp.data) {
        setActiveOrder(resp.data!);
        updateOrder(resp.data!);
      }
      // Alert.alert("Success", "Order detail updated successfully");
    },
    onError: (resp) => {
      Alert.alert("Error", resp.msg);
    },
  });

  const updateOrderDetailsEmitter = useWebsocketEventEmitter<
    Order,
    UpdateOrderDetailsDto
  >(OrderSocketEvent.updateOrderDetails, {
    // The caller is responsible for optimistic UI, undo handling and error feedback.
    onSuccess: () => {},
    onError: () => {},
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

  const addOrderDetailsEmitter = useWebsocketEventEmitter<
    UpdateOrderResp,
    AddOrderDetailsDto
  >(OrderSocketEvent.addOrderDetails, {
    onSuccess: (resp) => {
      const data = resp.data;

      if (data?.order && data?.ticket) {
        updateOrder(data.order);
        printComanda(data.order, data.ticket);
      }
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
    UpdateOrderResp,
    DeleteOrderDetailDto
  >(OrderSocketEvent.deleteOrderDetail, {
    onSuccess: (resp) => {
      const data = resp.data;
      // if (data?.order) {
      //   setActiveOrder(data.order);
      // }
      if (data?.order && data?.ticket) {
        printComanda(data.order, data.ticket);
      }
    },
    onError: (resp) => {
      Alert.alert("Error", resp.msg);
    },
  });

  return {
    createOrder: createOrderEmitter,
    updateOrderDetail: updateOrderDetailEmitter,
    addOrderDetailToOrder: useOrderDetailToOrderEmitter,
    addOrderDetails: addOrderDetailsEmitter,
    updateOrder: updateOrderEmitter,
    updateOrderDetails: updateOrderDetailsEmitter,
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
  const deleteOrder = useOrdersStore((state) => state.deleteOrder);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);

  useWebsocketEventListener<Order>(
    OrderSocketEvent.updateOrder,
    ({ data: order }: SocketEvent<Order>) => {
      console.log("Received order update for order:", order?.id);

      if (order!.isClosed) deleteOrder(order!.id);
      else
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
