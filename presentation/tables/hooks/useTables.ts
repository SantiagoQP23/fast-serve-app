import { Table } from "@/core/tables/models/table.model";
import { TablesService } from "@/core/tables/services/tables.service";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useTablesStore } from "./useTablesStore";
import { useEffect } from "react";

export const useTables = () => {
  const { currentRestaurant } = useAuthStore();
  const {
    tables: cachedTables,
    restaurantId: cachedRestaurantId,
    setTables,
    clearTables,
  } = useTablesStore();

  const tablesQuery = useQuery({
    queryKey: ["tables", currentRestaurant?.id],
    queryFn: () => TablesService.getTables(),
    enabled: false, // Disable automatic fetching - only fetch on manual refetch
  });

  // Clear tables if restaurant changed and auto-fetch new restaurant's tables
  useEffect(() => {
    if (
      currentRestaurant?.id &&
      cachedRestaurantId &&
      currentRestaurant.id !== cachedRestaurantId
    ) {
      clearTables();
      tablesQuery.refetch(); // Auto-fetch when restaurant changes
    }
  }, [currentRestaurant?.id, cachedRestaurantId, clearTables, tablesQuery]);

  // Save to store when query succeeds
  useEffect(() => {
    if (tablesQuery.data && currentRestaurant?.id) {
      setTables(tablesQuery.data, currentRestaurant.id);
    }
  }, [tablesQuery.data, currentRestaurant?.id, setTables]);

  // Return cached data as primary source (instant load)
  // Falls back to query data if cache is empty
  const tables =
    cachedTables.length > 0 ? cachedTables : tablesQuery.data || [];

  return {
    tables,
    refetch: tablesQuery.refetch,
    isRefetching: tablesQuery.isRefetching,
    isLoading: tablesQuery.isLoading,
    tablesQuery,
  };
};
