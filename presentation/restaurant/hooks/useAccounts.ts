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
    // Write to the store on every fetch rather than in an effect on `data`:
    // a refetch returning identical data keeps the same reference, so the
    // effect wouldn't fire and a stale/partial cache would never be fixed.
    queryFn: async () => {
      const data = await AccountsService.getAccounts();
      if (currentRestaurant?.id) setAccounts(data, currentRestaurant.id);
      return data;
    },
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

  const accounts =
    cachedAccounts.length > 0 ? cachedAccounts : accountsQuery.data ?? [];

  return {
    accounts,
    accountsQuery,
  };
};
