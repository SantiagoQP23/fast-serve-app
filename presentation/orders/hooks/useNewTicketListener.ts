import { Ticket } from "@/core/tickets/models/ticket.model";
import { OrderSocketEvent } from "@/core/orders/enums/socket-events.enum";
import { useWebsocketEventListener } from "@/presentation/shared/hooks/useWebsocketEventListener";
import { SocketEvent } from "@/core/common/dto/socket.dto";
import { useCallback } from "react";

export const useNewTicketListener = (onNewTicket: (ticket: Ticket) => void) => {
  const handleNewTicket = useCallback(
    ({ data }: SocketEvent<Ticket>) => {
      if (data) {
        onNewTicket(data);
      }
    },
    [onNewTicket],
  );

  useWebsocketEventListener<Ticket>(OrderSocketEvent.newTicket, handleNewTicket);
};
