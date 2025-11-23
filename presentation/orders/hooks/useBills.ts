import { BillsService } from "@/core/orders/services/bills.service";
import { useQuery } from "@tanstack/react-query";

export const useBills = () => {
  const billsByOrderQuery = (orderId: string) =>
    useQuery({
      queryKey: ["bills", orderId],
      queryFn: async () => BillsService.getBillByOrders(orderId),
    });

  return {
    billsByOrderQuery,
  };
};
