import { SyncEventDto } from "@/core/sync/dto/sync-response.dto";
import { SyncOperation } from "@/core/sync/enums/sync-operation.enum";
import { Ticket } from "@/core/tickets/models/ticket.model";
import { useUnprintedTicketsStore } from "@/presentation/orders/store/useUnprintedTicketsStore";

/** Applies a TICKET sync event to the unprinted tickets store. */
export function applyTicketEvent(event: SyncEventDto) {
  const store = useUnprintedTicketsStore.getState();

  switch (event.operation) {
    case SyncOperation.CREATED:
    case SyncOperation.UPDATED:
      store.applyTicket(event.data as Ticket);
      break;
    case SyncOperation.DELETED:
      store.removeTicket(event.resourceId);
      break;
  }
}
