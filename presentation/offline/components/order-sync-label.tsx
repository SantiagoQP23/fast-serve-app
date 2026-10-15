import Label from "@/presentation/theme/components/label";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useOrderSyncState } from "../hooks/useOrderSyncState";

/** "Sin sincronizar" / "Error al sincronizar" on an order with unsent actions. */
export default function OrderSyncLabel({ orderId }: { orderId?: string }) {
  const { t } = useTranslation(["orders"]);
  const syncState = useOrderSyncState(orderId);

  if (!syncState) return null;

  return (
    <Label
      size="small"
      leftIcon={
        syncState === "failed" ? "alert-circle-outline" : "cloud-upload-outline"
      }
      color={syncState === "failed" ? "error" : "warning"}
      text={
        syncState === "failed"
          ? t("orders:offline.syncFailed")
          : t("orders:offline.notSynced")
      }
    />
  );
}
