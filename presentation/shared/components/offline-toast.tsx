import { useContext, useEffect } from "react";
import { toast } from "sonner-native";
import { SocketContext } from "../context/SocketContext";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

// The socket starts offline until it connects, so wait a moment before
// warning, otherwise the toast flashes on every launch and login.
const OFFLINE_GRACE_MS = 2500;

/** Tells the user, once per drop, that the app is working without connection. */
export function OfflineToast() {
  const { online } = useContext(SocketContext);
  const { t } = useTranslation();

  useEffect(() => {
    if (online) return;

    const timer = setTimeout(
      () => toast.info(t("common:connection.offline")),
      OFFLINE_GRACE_MS,
    );
    return () => clearTimeout(timer);
  }, [online, t]);

  return null;
}
