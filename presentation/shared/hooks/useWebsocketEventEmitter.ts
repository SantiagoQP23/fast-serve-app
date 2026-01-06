import { useContext, useState } from "react";
import { SocketContext } from "../context/SocketContext";
import {
  SocketResponse,
  SocketResponseData,
} from "@/core/common/dto/socket.dto";
import { useGlobalStore } from "../store/useGlobalStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

interface WebSocketOptions<TData> {
  onSuccess?: (resp: TData) => void;
  onError?: (resp: SocketResponse) => void;
  onTimeout?: () => void;
  timeout?: number;
}

/**
 * Hook to use websockets with timeout support
 * @version v1.0 24-12-2023
 * @version v1.1 05-01-2026 Add timeout mechanism with configurable duration
 */
export function useWebsocketEventEmitter<TData, TVariables>(
  eventMessage: string,
  options?: WebSocketOptions<SocketResponseData<TData>>,
) {
  const { socket, online } = useContext(SocketContext);
  const [loading, setLoading] = useState(false);
  const setIsLoading = useGlobalStore((state) => state.setIsLoading);
  const { t } = useTranslation();

  const mutate = async (
    data: TVariables,
    secondaryOptions?: WebSocketOptions<SocketResponseData<TData>>,
  ) => {
    setLoading(true);
    setIsLoading(true);

    const timeoutDuration =
      options?.timeout ?? secondaryOptions?.timeout ?? 20000;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let responseReceived = false;

    // Set up timeout handler
    timeoutId = setTimeout(() => {
      if (!responseReceived) {
        setLoading(false);
        setIsLoading(false);

        const timeoutError: SocketResponse = {
          ok: false,
          msg: t("errors:general.requestTimedOut"),
        };

        // Call timeout callbacks if provided
        options?.onTimeout?.();
        secondaryOptions?.onTimeout?.();

        // Call error callbacks with timeout error
        options?.onError?.(timeoutError);
        secondaryOptions?.onError?.(timeoutError);
      }
    }, timeoutDuration);

    socket?.emit(eventMessage, data, (resp: SocketResponseData<TData>) => {
      responseReceived = true;

      // Clear timeout since we received a response
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      setLoading(false);
      setIsLoading(false);

      if (resp.ok) {
        options?.onSuccess?.(resp);
        secondaryOptions?.onSuccess?.(resp);
      } else {
        options?.onError?.(resp);
        secondaryOptions?.onError?.(resp);
      }
    });
  };

  return {
    mutate,
    isLoading: loading,
    isOnline: online,
  };
}
