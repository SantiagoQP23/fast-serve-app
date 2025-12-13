import React, { createContext, FC, useEffect } from "react";
import { Socket } from "socket.io-client";
import { useSocket } from "../hooks/useSocket";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Platform } from "react-native";

const STAGE = process.env.EXPO_PUBLIC_STAGE || "dev";

export const API_URL =
  STAGE === "prod"
    ? process.env.EXPO_PUBLIC_API_URL
    : Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_API_URL_IOS
      : process.env.EXPO_PUBLIC_API_URL_ANDROID;

interface ISocket {
  socket: Socket | null;
  online: boolean | undefined;
  conectarSocket: () => void;
  desconectarSocket: () => void;
}

interface Props {
  children: React.ReactNode;
}

export const SocketContext = createContext({} as ISocket);

export const SocketProvider: FC<Props> = ({ children }) => {
  const { socket, online, conectarSocket, desconectarSocket } = useSocket(
    `${API_URL}/socket.io/socket.io.js`,
  );

  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === "unauthenticated") {
      console.log("Desconectando socket");
      desconectarSocket();
    }
  }, [status, desconectarSocket]);

  useEffect(() => {
    if (status === "authenticated") {
      console.log("conectando socket");
      conectarSocket();
    }
  }, [status, conectarSocket]);

  return (
    <SocketContext.Provider value={{ socket, online, conectarSocket, desconectarSocket }}>
      {children}
    </SocketContext.Provider>
  );
};
