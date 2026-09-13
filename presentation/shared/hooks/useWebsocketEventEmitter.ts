import { useContext, useRef, useState } from "react";
import { SocketContext } from "../context/SocketContext";
import {
  SocketResponse,
  SocketResponseData,
} from "@/core/common/dto/socket.dto";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useGlobalStore } from "@/presentation/shared/store/useGlobalStore";

interface WebSocketOptions<TData> {
  onSuccess?: (resp: TData) => void;
  onError?: (resp: SocketResponse) => void;
  onTimeout?: () => void;
  timeout?: number;
  /**
   * i18n key (namespace:key) used by the global socket-loading bottom sheet
   * while this event is in flight. Defaults to `common:socketLoader.<eventMessage>`,
   * falling back to `common:socketLoader.default` when no translation exists.
   */
  loadingMessageKey?: string;
}

/**
 * Hook to use websockets with timeout support
 * @version v1.0 24-12-2023
 * @version v1.1 05-01-2026 Add timeout mechanism with configurable duration
 * @version v1.2 12-09-2026 Drive the global socket-loading bottom sheet
 */
export function useWebsocketEventEmitter<TData, TVariables>(
  eventMessage: string,
  options?: WebSocketOptions<SocketResponseData<TData>>,
) {
  const { socket, online } = useContext(SocketContext);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const requestIdRef = useRef(0);

  const mutate = async (
    data: TVariables,
    secondaryOptions?: WebSocketOptions<SocketResponseData<TData>>,
  ) => {
    setLoading(true);

    const requestId = `${eventMessage}-${Date.now()}-${requestIdRef.current++}`;
    const messageKey =
      secondaryOptions?.loadingMessageKey ??
      options?.loadingMessageKey ??
      `common:socketLoader.${eventMessage}`;
    useGlobalStore.getState().pushSocketLoading(requestId, messageKey);

    const clearLoading = () => {
      setLoading(false);
      useGlobalStore.getState().popSocketLoading(requestId);
    };

    const timeoutDuration =
      options?.timeout ?? secondaryOptions?.timeout ?? 20000;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let responseReceived = false;

    // Set up timeout handler
    timeoutId = setTimeout(() => {
      if (!responseReceived) {
        clearLoading();

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

      clearLoading();

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
