import { queryClient } from "@/app/_layout";
import { OrderSocketEvent } from "@/core/orders/enums/socket-events.enum";
import { useWebsocketEventEmitter } from "@/presentation/shared/hooks/useWebsocketEventEmitter";
import { Alert } from "react-native";
import { RemoveTransactionReqDto } from "../interfaces/dto/remove-transaction-req.dto";
import { RemoveTransactionRespDto } from "../interfaces/dto/remove-transaction-resp.dto";

export const useTransactions = () => {
  const removeTransaction = useWebsocketEventEmitter<
    RemoveTransactionRespDto,
    RemoveTransactionReqDto
  >(OrderSocketEvent.removeTransaction, {
    onSuccess: (resp) => {
      if (resp.data) {
        queryClient.invalidateQueries({
          queryKey: ["bills", resp.data.bill.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["bill", resp.data.bill.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["bills", resp.data?.order?.id],
        });
      }
    },
    onError: (resp) => {
      Alert.alert("Error", resp.msg);
    },
  });

  return {
    removeTransaction,
  };
};
