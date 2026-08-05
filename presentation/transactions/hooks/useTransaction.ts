import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TransactionsService } from "@/core/transactions/services/transactions.service";

export const useTransaction = (id: number | null) => {
  const query = useQuery({
    queryKey: ["transaction", id],
    queryFn: () =>
      id ? TransactionsService.getTransactionById(id) : Promise.resolve(null),
    staleTime: 10000,
    enabled: !!id,
  });

  return {
    transaction: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { accountId?: number };
    }) => TransactionsService.updateTransaction(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["transaction", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["transactionsList"] });
    },
  });

  return {
    updateTransaction: mutation.mutate,
    isLoading: mutation.isPending,
  };
};

export const useApproveTransaction = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => TransactionsService.approveTransaction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["transaction", id] });
      queryClient.invalidateQueries({ queryKey: ["transactionsList"] });
      queryClient.invalidateQueries({ queryKey: ["billsList"] });
    },
  });

  return {
    approveTransaction: mutation.mutate,
    isLoading: mutation.isPending,
  };
};

export const useRejectTransaction = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      TransactionsService.rejectTransaction(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["transaction", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["transactionsList"] });
      queryClient.invalidateQueries({ queryKey: ["billsList"] });
    },
  });

  return {
    rejectTransaction: mutation.mutate,
    isLoading: mutation.isPending,
  };
};
