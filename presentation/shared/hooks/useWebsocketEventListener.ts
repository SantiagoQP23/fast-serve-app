import { SocketEvent } from "@/core/common/dto/socket.dto";
import { OrderSocketEvent } from "@/core/orders/enums/socket-events.enum";
import { useContext, useEffect } from "react";
import { SocketContext } from "../context/SocketContext";

export const useWebsocketEventListener = <T>(
  event: OrderSocketEvent,
  callback: (socketEvent: SocketEvent<T>) => void,
) => {
  const { socket } = useContext(SocketContext);

  useEffect(() => {
    socket?.on(event, (socketEvent: SocketEvent<T>) => {
      callback(socketEvent);
    });
    return () => {
      socket?.off(event);
    };
  }, [socket]);
};
