import { queryClient } from "@/app/_layout";
import { CreateBillDto } from "@/core/orders/dto/create-bill.dto";
import { OrderSocketEvent } from "@/core/orders/enums/socket-events.enum";
import { Order } from "@/core/orders/models/order.model";
import { BillsService } from "@/core/orders/services/bills.service";
import { useWebsocketEventEmitter } from "@/presentation/shared/hooks/useWebsocketEventEmitter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

// Get QueryClient from the context

export const useBills = () => {
  const createBillEmitter = useWebsocketEventEmitter<Order, CreateBillDto>(
    OrderSocketEvent.createBill,
    {
      onSuccess: (resp) => {
        if (resp.data)
          queryClient.invalidateQueries({
            queryKey: ["bills", resp.data.id],
          });
      },
      onError: (resp) => {
        Alert.alert("Error", resp.msg);
      },
    },
  );

  const billsByOrderQuery = (orderId: string) =>
    useQuery({
      queryKey: ["bills", orderId],
      queryFn: async () => BillsService.getBillByOrders(orderId),
    });

  return {
    billsByOrderQuery,
    createBill: createBillEmitter,
  };
};
