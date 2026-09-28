import { useQuery } from "@tanstack/react-query";
import { InventoryService } from "../services/inventory.service";

export const useInventoryItemDetail = (id: string) => {
  const itemQuery = useQuery({
    queryKey: ["inventory-items", id],
    queryFn: () => InventoryService.getById(id),
    enabled: !!id,
  });

  const movementsQuery = useQuery({
    queryKey: ["inventory-movements", id],
    queryFn: () => InventoryService.getMovementsByItem(id),
    enabled: !!id,
  });

  return {
    item: itemQuery.data,
    itemQuery,
    movements: movementsQuery.data ?? [],
    movementsQuery,
  };
};
