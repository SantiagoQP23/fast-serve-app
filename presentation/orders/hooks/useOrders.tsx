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
  MergeOrderDto,
  MergeOrderResp,
  ReplaceOrderDetailDto,
  UpdateOrderResp,
  UpdateOrderDetailsDto,
  UpdateOrderDetailDto,
  UpdateOrderDto,
} from "@/core/orders/dto/update-order.dto";
import { SocketEvent } from "@/core/common/dto/socket.dto";
import { useWebsocketEventListener } from "@/presentation/shared/hooks/useWebsocketEventListener";
import { usePrintComanda } from "./usePrintComanda";
import {
  QueueOptions,
  isQueueableOrderUpdate,
  useOrderOutbox,
} from "@/presentation/offline/hooks/useOrderOutbox";

type Emitter<TData, TVariables> = ReturnType<
  typeof useWebsocketEventEmitter<TData, TVariables>
>;
type EmitterOptions<TData, TVariables> = Parameters<
  Emitter<TData, TVariables>["mutate"]
>[1];

/**
 * Sends the action as before when online; without a connection (or while
 * earlier offline actions still wait) it goes to the outbox instead, which
 * updates the order on the phone right away and sends it later. Actions that
 * can be queued are never blocked by being offline, so isOnline is true.
 */
const withOutbox = <TData, TVariables>(
  emitter: Emitter<TData, TVariables>,
  shouldQueue: () => boolean,
  queue: (data: TVariables, options: QueueOptions<TData>) => unknown,
  canQueue: (data: TVariables) => boolean = () => true,
) => ({
  ...emitter,
  isOnline: true,
  mutate: (
    data: TVariables,
    options?: EmitterOptions<TData, TVariables> & { print?: boolean },
  ) => {
    if (canQueue(data) && shouldQueue()) {
      void queue(data, options ?? {});
      return Promise.resolve();
    }
    return emitter.mutate(data, options);
  },
});

export const useOrders = () => {
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const updateOrder = useOrdersStore((state) => state.updateOrder);
  // Only replaces the open order when the answer is for it, so a late
  // answer never switches the screen to another order.
  const setActiveOrderIfOpen = (order: Order) => {
    if (useOrdersStore.getState().activeOrder?.id === order.id) {
      setActiveOrder(order);
    }
  };
  const { printComanda } = usePrintComanda();
  const outbox = useOrderOutbox();

  const createOrderEmitter = useWebsocketEventEmitter<Order, CreateOrderDto>(
    OrderSocketEvent.createOrder,
    {
      onSuccess: (resp) => {
        const order = resp.data;
        if (order) {
          setActiveOrder(order);
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
    UpdateOrderResp,
    UpdateOrderDetailDto
  >(OrderSocketEvent.updateOrderDetail, {
    onSuccess: (resp) => {
      const data = resp.data;
      if (data?.order) {
        setActiveOrder(data.order);
        updateOrder(data.order);
      }
      if (data?.order && data?.ticket) {
        printComanda(data.order, data.ticket);
      }
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
    UpdateOrderResp,
    AddOrderDetailToOrderDto
  >(OrderSocketEvent.addOrderDetail, {
    onSuccess: (resp) => {
      const data = resp.data;
      if (data?.order) setActiveOrder(data.order);
      if (data?.order && data?.ticket) {
        printComanda(data.order, data.ticket);
      }
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

      if (data?.order) {
        updateOrder(data.order);
        // The cart navigates to the order screen, which reads activeOrder,
        // so show the new items right away instead of after the next sync.
        setActiveOrderIfOpen(data.order);
      }
      if (data?.order && data?.ticket) {
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
      if (data?.order) {
        updateOrder(data.order);
        setActiveOrderIfOpen(data.order);
      }
      if (data?.order && data?.ticket) {
        printComanda(data.order, data.ticket);
      }
    },
    onError: (resp) => {
      Alert.alert("Error", resp.msg);
    },
  });

  const replaceOrderDetailEmitter = useWebsocketEventEmitter<
    UpdateOrderResp,
    ReplaceOrderDetailDto
  >(OrderSocketEvent.replaceOrderDetail, {
    onSuccess: (resp) => {
      const data = resp.data;
      if (data?.order) {
        setActiveOrder(data.order);
        updateOrder(data.order);
      }
      if (data?.order && data?.ticket) {
        printComanda(data.order, data.ticket);
      }
    },
    onError: (resp) => {
      Alert.alert("Error", resp.msg);
    },
  });

  const deleteOrderFromStore = useOrdersStore((state) => state.deleteOrder);

  const mergeOrderEmitter = useWebsocketEventEmitter<
    MergeOrderResp,
    MergeOrderDto
  >(OrderSocketEvent.mergeOrder, {
    onSuccess: (resp) => {
      const data = resp.data;
      if (!data?.order) return;
      if (data.mergedOrder?.id) deleteOrderFromStore(data.mergedOrder.id);
      updateOrder(data.order);
      setActiveOrder(data.order);
    },
    onError: (resp) => {
      Alert.alert("Error", resp.msg);
    },
  });

  return {
    createOrder: withOutbox(
      createOrderEmitter,
      outbox.shouldQueue,
      outbox.createOrder,
    ),
    updateOrderDetail: withOutbox(
      updateOrderDetailEmitter,
      outbox.shouldQueue,
      outbox.updateOrderDetail,
    ),
    addOrderDetailToOrder: withOutbox(
      useOrderDetailToOrderEmitter,
      outbox.shouldQueue,
      outbox.addOrderDetail,
    ),
    addOrderDetails: withOutbox(
      addOrderDetailsEmitter,
      outbox.shouldQueue,
      outbox.addOrderDetails,
    ),
    // Closing, paying or reassigning an order still needs the server.
    updateOrder: withOutbox(
      updateOrderEmitter,
      outbox.shouldQueue,
      outbox.updateOrder,
      isQueueableOrderUpdate,
    ),
    updateOrderDetails: withOutbox(
      updateOrderDetailsEmitter,
      outbox.shouldQueue,
      outbox.updateOrderDetails,
    ),
    removeOrderDetail: withOutbox(
      removeOrderDetailEmitter,
      outbox.shouldQueue,
      outbox.removeOrderDetail,
    ),
    replaceOrderDetail: replaceOrderDetailEmitter,
    deleteOrder: deleteOrderEmitter,
    mergeOrder: mergeOrderEmitter,
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
      if (order!.isClosed) deleteOrder(order!.id);
      else
        // Update the order in the list
        updateOrder(order!);

      // Get current active order state at the time of the event
      const currentActiveOrder = useOrdersStore.getState().activeOrder;

      if (currentActiveOrder?.id === order?.id) {
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
