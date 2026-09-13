import { AccountsService } from "@/core/restaurant/services/accounts.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAccountsStore } from "../store/useAccountsStore";

export const useAccounts = () => {
  const { currentRestaurant } = useAuthStore();
  const {
    accounts: cachedAccounts,
    restaurantId: cachedRestaurantId,
    setAccounts,
    clearAccounts,
  } = useAccountsStore();

  const accountsQuery = useQuery({
    queryKey: ["accounts", currentRestaurant?.id],
    queryFn: () => AccountsService.getAccounts(),
    enabled: false,
  });

  // Detect restaurant switch → clear stale cache → auto-refetch
  useEffect(() => {
    if (
      currentRestaurant?.id &&
      cachedRestaurantId &&
      currentRestaurant.id !== cachedRestaurantId
    ) {
      clearAccounts();
      accountsQuery.refetch();
    }
  }, [currentRestaurant?.id, cachedRestaurantId, clearAccounts, accountsQuery]);

  // Sync React Query result → Zustand store
  useEffect(() => {
    if (accountsQuery.data && currentRestaurant?.id) {
      setAccounts(accountsQuery.data, currentRestaurant.id);
    }
  }, [accountsQuery.data, currentRestaurant?.id, setAccounts]);

  const accounts =
    cachedAccounts.length > 0 ? cachedAccounts : accountsQuery.data ?? [];

  return {
    accounts,
    accountsQuery,
  };
};
