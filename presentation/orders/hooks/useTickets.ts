import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TicketsService } from "@/core/tickets/services/tickets.service";
import { Ticket } from "@/core/tickets/models/ticket.model";
import { useEffect } from "react";
import { useUnprintedTicketsStore } from "@/presentation/orders/store/useUnprintedTicketsStore";

export const useTickets = (orderId: string | null) => {
  const queryClient = useQueryClient();

  const ticketsQuery = useQuery<Ticket[]>({
    queryKey: ["tickets", orderId],
    queryFn: () => TicketsService.getTicketsByOrderId(orderId!),
    enabled: !!orderId,
  });

  // Refetch when a TICKET sync event touches this order (new ticket, printed
  // or skipped).
  const ticketsVersion = useUnprintedTicketsStore((state) =>
    orderId ? state.orderVersions[orderId] : undefined,
  );
  useEffect(() => {
    if (ticketsVersion === undefined) return;
    queryClient.invalidateQueries({ queryKey: ["tickets", orderId] });
  }, [ticketsVersion, orderId, queryClient]);

  const markPrintedMutation = useMutation({
    mutationFn: (ticketId: string) => TicketsService.markTicketPrinted(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets", orderId] });
    },
  });

  return {
    tickets: ticketsQuery.data ?? [],
    isLoading: ticketsQuery.isLoading,
    isError: ticketsQuery.isError,
    refetch: ticketsQuery.refetch,
    markPrinted: markPrintedMutation.mutate,
  };
};
