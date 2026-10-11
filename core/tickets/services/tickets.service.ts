import { restaurantApi } from "@/core/api/restaurantApi";
import { Ticket } from "../models/ticket.model";

export const TicketsService = {
  getTicketsByOrderId: async (orderId: string): Promise<Ticket[]> => {
    const { data } = await restaurantApi.get<Ticket[]>(
      `/tickets/order/${orderId}`,
    );
    return data;
  },

  markTicketPrinted: async (ticketId: string): Promise<Ticket> => {
    const { data } = await restaurantApi.patch<Ticket>(
      `/tickets/${ticketId}/printed`,
    );
    return data;
  },

  /** Skips several tickets in one request; returns the ones skipped. */
  skipTickets: async (ticketIds: string[]): Promise<Ticket[]> => {
    const { data } = await restaurantApi.patch<Ticket[]>(`/tickets/skip`, {
      ticketIds,
    });
    return data;
  },

  skipTicket: async (ticketId: string): Promise<Ticket> => {
    const { data } = await restaurantApi.patch<Ticket>(
      `/tickets/${ticketId}/skip`,
    );
    return data;
  },
};
