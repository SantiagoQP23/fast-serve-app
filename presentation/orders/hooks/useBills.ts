import { queryClient } from "@/app/_layout";
import { CreateBillDto } from "@/core/orders/dto/create-bill.dto";
import { CreateSaleDto } from "@/core/orders/dto/create-sale.dto";
import { EditBillDto } from "@/core/orders/dto/edit-bill.dto";
import { EditDirectBillDto } from "@/core/orders/dto/edit-direct-bill.dto";
import { translateErrorCode } from "@/core/api/get-error-message";
import { PayBillTransactionRespDto } from "@/core/orders/dto/pay-bill-transaction-resp.dto";
import { PayBillTransactionDto } from "@/core/orders/dto/pay-bill-transaction.dto";
import { RemoveBillDto } from "@/core/orders/dto/remove-bill.dto";
import { UpdateBillDto } from "@/core/orders/dto/update-bill.dto";
import { OrderSocketEvent } from "@/core/orders/enums/socket-events.enum";
import { Bill } from "@/core/orders/models/bill.model";
import { Order } from "@/core/orders/models/order.model";
import { BillsService } from "@/core/orders/services/bills.service";
import { useWebsocketEventEmitter } from "@/presentation/shared/hooks/useWebsocketEventEmitter";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";

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
        toast.error(resp.msg);
      },
    },
  );

  const createSaleEmitter = useWebsocketEventEmitter<Bill, CreateSaleDto>(
    OrderSocketEvent.createSale,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["billsList"],
        });
        // if (resp.data)
        //   queryClient.invalidateQueries({
        //     queryKey: ["bills", resp.data.id],
        //   });
      },
      onError: (resp) => {
        toast.error(resp.msg);
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
        toast.error(resp.msg);
      },
    },
  );

  const editBillEmitter = useWebsocketEventEmitter<
    { order: Order; bill: Bill },
    EditBillDto
  >(OrderSocketEvent.editBill, {
    onSuccess: (resp) => {
      console.log("bill updated", resp.data);
      queryClient.invalidateQueries({
        queryKey: ["billsList"],
      });

      if (resp.data) {
        queryClient.invalidateQueries({
          queryKey: ["bill", resp.data.bill.id],
        });
      }
    },
    onError: (resp) => {
      toast.error(resp.msg);
    },
  });

  const editDirectBillEmitter = useWebsocketEventEmitter<
    Bill,
    EditDirectBillDto
  >(OrderSocketEvent.editDirectBill, {
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ["billsList"] });
      if (resp.data)
        queryClient.invalidateQueries({ queryKey: ["bill", resp.data.id] });
    },
    onError: (resp) => {
      toast.error(translateErrorCode(resp.code, resp.msg));
    },
  });

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
      toast.error(resp.msg);
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
        queryKey: ["bill", resp.data?.billId],
      });
      queryClient.invalidateQueries({
        queryKey: ["transactionsList"],
      });
      queryClient.invalidateQueries({
        queryKey: ["billsList"],
      });
    },
    // The paying screen reports the failure itself (a toast that keeps the
    // cashier on the screen to retry); a toast here would show it twice.
  });

  const billsByOrderQuery = (orderId: string) =>
    useQuery({
      queryKey: ["bills", orderId],
      queryFn: async () => BillsService.getBillByOrders(orderId),
      enabled: !!orderId,
    });

  const billByIdQuery = (billId: number) =>
    useQuery({
      queryKey: ["bill", billId],
      queryFn: () => BillsService.getBillById(billId),
      enabled: !!billId,
      // A deleted bill won't come back; say so right away instead of retrying.
      retry: (failureCount, error) =>
        (error as { response?: { status?: number } })?.response?.status !==
          404 && failureCount < 3,
    });

  return {
    billsByOrderQuery,
    billByIdQuery,
    createBill: createBillEmitter,
    createSale: createSaleEmitter,
    updateBill: updateBillEmitter,
    editBill: editBillEmitter,
    editDirectBill: editDirectBillEmitter,
    removeBill: removeBillEmitter,
    payBillTransaction: payBillTransactionEmitter,
  };
};
