import { PaymentProofsService } from "@/core/transactions/services/payment-proofs.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export const usePaymentProofs = (transactionId?: number) => {
  const queryClient = useQueryClient();

  const proofsQuery = useQuery({
    queryKey: ["paymentProofs", transactionId],
    queryFn: () =>
      transactionId
        ? PaymentProofsService.getProofsByTransaction(transactionId)
        : Promise.resolve([]),
    enabled: !!transactionId,
  });

  const uploadProofMutation = useMutation({
    mutationFn: ({
      transactionId,
      fileUri,
      fileName,
      mimeType,
    }: {
      transactionId: number;
      fileUri: string;
      fileName: string;
      mimeType: string;
    }) => PaymentProofsService.uploadProof(transactionId, fileUri, fileName, mimeType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentProofs"] });
      if (transactionId) {
        queryClient.invalidateQueries({ queryKey: ["paymentProofs", transactionId] });
        queryClient.invalidateQueries({ queryKey: ["transactionsList"] });
        queryClient.invalidateQueries({ queryKey: ["bill"] });
      }
    },
  });

  const approveProofMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
      PaymentProofsService.approveProof(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentProofs"] });
      queryClient.invalidateQueries({ queryKey: ["transactionsList"] });
      queryClient.invalidateQueries({ queryKey: ["pendingProofs"] });
    },
  });

  const rejectProofMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      PaymentProofsService.rejectProof(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentProofs"] });
      queryClient.invalidateQueries({ queryKey: ["transactionsList"] });
      queryClient.invalidateQueries({ queryKey: ["pendingProofs"] });
    },
  });

  const pendingProofsQuery = useQuery({
    queryKey: ["pendingProofs"],
    queryFn: () => PaymentProofsService.getPendingProofs(),
  });

  const invalidateProofs = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["paymentProofs"] });
    queryClient.invalidateQueries({ queryKey: ["transactionsList"] });
    queryClient.invalidateQueries({ queryKey: ["pendingProofs"] });
  }, [queryClient]);

  return {
    proofs: proofsQuery.data ?? [],
    isLoadingProofs: proofsQuery.isLoading,
    refetchProofs: proofsQuery.refetch,
    uploadProof: uploadProofMutation,
    approveProof: approveProofMutation,
    rejectProof: rejectProofMutation,
    pendingProofs: pendingProofsQuery.data ?? [],
    isLoadingPending: pendingProofsQuery.isLoading,
    refetchPending: pendingProofsQuery.refetch,
    invalidateProofs,
  };
};
