import { Order } from "@/core/orders/models/order.model";
import { Ticket } from "@/core/tickets/models/ticket.model";
import { TicketsService } from "@/core/tickets/services/tickets.service";
import { useUnprintedTicketsStore } from "@/presentation/orders/store/useUnprintedTicketsStore";
import { useOutboxStore } from "./store/useOutboxStore";

/**
 * Online, an action's comanda waits for the server's answer (so it carries
 * a new order's number, and nothing the server rejects reaches the
 * kitchen). If the answer takes longer than this, the phone prints its own
 * so the kitchen isn't kept waiting.
 */
export const SLOW_SERVER_PRINT_MS = 5000;

type PrintComanda = (
  order: Order,
  ticket: Ticket,
  options?: { markPrinted?: boolean },
) => Promise<boolean>;

/**
 * Who printed each operation's comanda: the phone after the wait (its
 * promise resolves to whether it printed), or the answer (true). Lives in
 * memory only; after a restart the persisted `markTicketsPrinted` says it.
 */
const claims = new Map<string, Promise<boolean>>();

/**
 * Takes the comanda of `operationId` for the server's answer. Returns
 * "print" when the answer should print it, "printed" when the phone already
 * printed its own (so the server's ticket is only marked printed), or
 * "unprinted" when the phone tried and failed (the ticket stays in "Tickets
 * por imprimir").
 */
export const claimForAnswer = async (
  operationId: string,
): Promise<"print" | "printed" | "unprinted"> => {
  const phone = claims.get(operationId);
  if (phone) {
    claims.delete(operationId);
    return (await phone) ? "printed" : "unprinted";
  }
  claims.set(operationId, Promise.resolve(true));
  // The answer printed it; nothing else will ask.
  setTimeout(() => claims.delete(operationId), SLOW_SERVER_PRINT_MS * 2);
  return "print";
};

/**
 * Prints the phone's comanda for an action if the server hasn't answered
 * after SLOW_SERVER_PRINT_MS. Runs outside any screen, so leaving it doesn't
 * cancel it.
 */
export const printComandaIfServerIsSlow = (
  operationId: string,
  order: Order,
  ticket: Ticket,
  printComanda: PrintComanda,
) => {
  setTimeout(() => {
    const op = useOutboxStore
      .getState()
      .operations.find((o) => o.id === operationId);
    // Answered already, rejected, or discarded.
    if (
      !op ||
      op.status === "failed" ||
      !op.printOnSuccess ||
      claims.has(operationId)
    )
      return;

    const printing = printComanda(order, ticket, { markPrinted: false }).then(
      (printed) => {
        // Still queued (e.g. the connection dropped): remember across a
        // restart that the answer must not print it again.
        if (printed) {
          useOutboxStore.getState().patch(operationId, {
            printOnSuccess: false,
            markTicketsPrinted: true,
          });
        }
        return printed;
      },
    );
    claims.set(operationId, printing);
  }, SLOW_SERVER_PRINT_MS);
};

/** Tells the server the phone already printed these tickets. */
export const markTicketsPrinted = async (
  orderId: string,
  tickets: Ticket[],
) => {
  for (const ticket of tickets) {
    try {
      await TicketsService.markTicketPrinted(ticket.id);
      useUnprintedTicketsStore
        .getState()
        .applyTicket({ ...ticket, orderId, printed: true });
    } catch (e) {
      console.warn("Failed to mark ticket as printed:", e);
    }
  }
};
