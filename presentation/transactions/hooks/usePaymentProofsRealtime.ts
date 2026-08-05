import { OrderSocketEvent } from "@/core/orders/enums/socket-events.enum";
import { useWebsocketEventListener } from "@/presentation/shared/hooks/useWebsocketEventListener";
import { PaymentProof } from "@/core/transactions/models/payment-proof.model";
import { queryClient } from "@/app/_layout";

export const usePaymentProofsRealtime = () => {
  useWebsocketEventListener<PaymentProof>(
    OrderSocketEvent.paymentProofUploaded,
    () => {
      queryClient.invalidateQueries({ queryKey: ["paymentProofs"] });
      queryClient.invalidateQueries({ queryKey: ["transactionsList"] });
      queryClient.invalidateQueries({ queryKey: ["pendingProofs"] });
      queryClient.invalidateQueries({ queryKey: ["billsList"] });
    },
  );

  useWebsocketEventListener<PaymentProof>(
    OrderSocketEvent.paymentProofApproved,
    () => {
      queryClient.invalidateQueries({ queryKey: ["paymentProofs"] });
      queryClient.invalidateQueries({ queryKey: ["transactionsList"] });
      queryClient.invalidateQueries({ queryKey: ["pendingProofs"] });
      queryClient.invalidateQueries({ queryKey: ["billsList"] });
    },
  );

  useWebsocketEventListener<PaymentProof>(
    OrderSocketEvent.paymentProofRejected,
    () => {
      queryClient.invalidateQueries({ queryKey: ["paymentProofs"] });
      queryClient.invalidateQueries({ queryKey: ["transactionsList"] });
      queryClient.invalidateQueries({ queryKey: ["pendingProofs"] });
      queryClient.invalidateQueries({ queryKey: ["billsList"] });
    },
  );

  useWebsocketEventListener<PaymentProof>(
    OrderSocketEvent.transactionStatusUpdated,
    () => {
      queryClient.invalidateQueries({ queryKey: ["transaction"] });
      queryClient.invalidateQueries({ queryKey: ["transactionsList"] });
      queryClient.invalidateQueries({ queryKey: ["billsList"] });
    },
  );
};
