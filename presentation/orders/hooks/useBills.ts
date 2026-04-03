import { queryClient } from "@/app/_layout";
import { CreateBillDto } from "@/core/orders/dto/create-bill.dto";
import { CreateSaleDto } from "@/core/orders/dto/create-sale.dto";
import { PayBillTransactionRespDto } from "@/core/orders/dto/pay-bill-transaction-resp.dto";
import { PayBillTransactionDto } from "@/core/orders/dto/pay-bill-transaction.dto";
import { RemoveBillDto } from "@/core/orders/dto/remove-bill.dto";
import { UpdateBillDto } from "@/core/orders/dto/update-bill.dto";
import { OrderSocketEvent } from "@/core/orders/enums/socket-events.enum";
import { Bill } from "@/core/orders/models/bill.model";
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

  const createSaleEmitter = useWebsocketEventEmitter<Bill, CreateSaleDto>(
    OrderSocketEvent.createSale,
    {
      onSuccess: (resp) => {
        queryClient.invalidateQueries({
          queryKey: ["billsList"],
        });
        // if (resp.data)
        //   queryClient.invalidateQueries({
        //     queryKey: ["bills", resp.data.id],
        //   });
      },
      onError: (resp) => {
        Alert.alert("Error", resp.msg);
      },
    },
  );

  const updateBillEmitter = useWebsocketEventEmitter<Order, UpdateBillDto>(
    OrderSocketEvent.updateBill,
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

  const removeBillEmitter = useWebsocketEventEmitter<
    Order | null,
    RemoveBillDto
  >(OrderSocketEvent.deleteBill, {
    onSuccess: (resp) => {
      queryClient.invalidateQueries({
        queryKey: ["billsList"],
      });

      if (resp.data && resp.data.id)
        queryClient.invalidateQueries({
          queryKey: ["bills", resp.data.id],
        });
    },
    onError: (resp) => {
      Alert.alert("Error", resp.msg);
    },
  });

  const payBillTransactionEmitter = useWebsocketEventEmitter<
    PayBillTransactionRespDto,
    PayBillTransactionDto
  >(OrderSocketEvent.payBillTransaction, {
    onSuccess: (resp) => {
      if (resp.data && resp.data.orderId)
        queryClient.invalidateQueries({
          queryKey: ["bills", resp.data.orderId],
        });
      queryClient.invalidateQueries({
        queryKey: ["billsList"],
      });
    },
    onError: (resp) => {
      Alert.alert("Error", resp.msg);
    },
  });

  const billsByOrderQuery = (orderId: string) =>
    useQuery({
      queryKey: ["bills", orderId],
      queryFn: async () => BillsService.getBillByOrders(orderId),
    });

  const billByIdQuery = (billId: number) =>
    useQuery({
      queryKey: ["bill", billId],
      queryFn: () => BillsService.getBillById(billId),
      enabled: !!billId,
    });

  return {
    billsByOrderQuery,
    billByIdQuery,
    createBill: createBillEmitter,
    createSale: createSaleEmitter,
    updateBill: updateBillEmitter,
    removeBill: removeBillEmitter,
    payBillTransaction: payBillTransactionEmitter,
  };
};
