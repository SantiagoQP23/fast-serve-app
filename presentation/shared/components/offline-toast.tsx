import { useContext, useEffect, useRef } from "react";
import { toast } from "sonner-native";
import { SocketContext } from "../context/SocketContext";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

// The socket starts offline until it connects, so wait a moment before
// warning, otherwise the toast flashes on every launch and login.
const OFFLINE_GRACE_MS = 2500;

/**
 * Tells the user, once per drop, that the app is working without connection,
 * and again when the connection is back (only if they were warned).
 */
export function OfflineToast() {
  const { online } = useContext(SocketContext);
  const { t } = useTranslation();
  const offlineToastId = useRef<string | number | null>(null);

  useEffect(() => {
    if (online) {
      if (offlineToastId.current === null) return;

      toast.dismiss(offlineToastId.current);
      offlineToastId.current = null;
      toast.success(t("common:connection.reconnected"));
      return;
    }

    const timer = setTimeout(() => {
      offlineToastId.current = toast.info(t("common:connection.offline"));
    }, OFFLINE_GRACE_MS);
    return () => clearTimeout(timer);
  }, [online, t]);

  return null;
}
