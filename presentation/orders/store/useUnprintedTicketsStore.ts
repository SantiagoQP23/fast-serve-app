import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Ticket } from "@/core/tickets/models/ticket.model";
import { AsyncStorageAdapter } from "@/helpers/adapters/async-storage.adapter";

const isPending = (ticket: Ticket) => !ticket.printed && !ticket.skipped;

interface UnprintedTicketsState {
  tickets: Ticket[];
  /**
   * Bumped for an order each time one of its tickets changes, so an open
   * order tickets screen knows to refetch. Not persisted.
   */
  orderVersions: Record<string, number>;
  setTickets: (tickets: Ticket[]) => void;
  /** Adds or replaces the ticket, or drops it once printed or skipped. */
  applyTicket: (ticket: Ticket) => void;
  removeTicket: (ticketId: string) => void;
}

/**
 * Tickets that are neither printed nor skipped, kept up to date by the sync
 * snapshot and TICKET sync events. Persisted like the orders store, since
 * incremental syncs only send what changed.
 */
export const useUnprintedTicketsStore = create<UnprintedTicketsState>()(
  persist(
    (set) => ({
      tickets: [],
      orderVersions: {},
      setTickets: (tickets) => set({ tickets: tickets.filter(isPending) }),
      applyTicket: (ticket) =>
        set((state) => {
          const others = state.tickets.filter((t) => t.id !== ticket.id);
          return {
            tickets: isPending(ticket) ? [...others, ticket] : others,
            orderVersions: {
              ...state.orderVersions,
              [ticket.orderId]: (state.orderVersions[ticket.orderId] ?? 0) + 1,
            },
          };
        }),
      removeTicket: (ticketId) =>
        set((state) => ({
          tickets: state.tickets.filter((t) => t.id !== ticketId),
        })),
    }),
    {
      name: "unprintedTicketsStore",
      storage: createJSONStorage(() => AsyncStorageAdapter),
      partialize: (state) => ({ tickets: state.tickets }),
    },
  ),
);
