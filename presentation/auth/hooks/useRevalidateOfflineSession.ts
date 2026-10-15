import { useContext, useEffect } from "react";
import { SocketContext } from "@/presentation/shared/context/SocketContext";
import { useAppForeground } from "@/presentation/shared/hooks/useAppForeground";
import { useAuthStore } from "../store/useAuthStore";

/**
 * When the app opened offline with the saved session, check it with the
 * server as soon as the connection is back (socket connects or the app
 * returns to the foreground). Refreshes the user and restaurant data, or logs
 * out if the token is no longer valid.
 */
export const useRevalidateOfflineSession = () => {
  const { online } = useContext(SocketContext);
  const isOfflineSession = useAuthStore((state) => state.isOfflineSession);
  const revalidateSession = useAuthStore((state) => state.revalidateSession);

  useEffect(() => {
    if (online && isOfflineSession) {
      void revalidateSession();
    }
  }, [online, isOfflineSession, revalidateSession]);

  useAppForeground(() => {
    if (useAuthStore.getState().isOfflineSession) {
      void revalidateSession();
    }
  });
};
