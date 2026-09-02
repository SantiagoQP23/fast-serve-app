import { useSync } from "@/presentation/sync/hooks/useSync";

export const useActiveOrders = (opts?: { skipGlobalLoader?: boolean }) => {
  const { isLoading, refetch, isRefetching } = useSync(opts);

  return {
    isLoading,
    refetchOrders: refetch,
    isRefetching,
  };
};
