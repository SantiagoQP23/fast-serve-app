import DialogModal from "@/presentation/theme/components/dialog-modal";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { Order } from "@/core/orders/models/order.model";
import { useOrders } from "../hooks/useOrders";
import { formatCurrency } from "@/core/i18n/utils";

interface CloseOrderModalProps {
  order: Order | null | undefined;
  visible: boolean;
  onClose: () => void;
  onClosed?: () => void;
  /** Money still owed; above zero the dialog warns it closes without it. */
  unpaidAmount?: number;
}

export default function CloseOrderModal({
  order,
  visible,
  onClose,
  onClosed,
  unpaidAmount = 0,
}: CloseOrderModalProps) {
  const { t } = useTranslation(["common", "orders"]);
  const { mutate: updateOrder, isLoading } = useOrders().updateOrder;

  const handleConfirm = () => {
    if (!order) return;

    updateOrder(
      { id: order.id, isClosed: true },
      {
        onSuccess: () => {
          onClose();
          onClosed?.();
        },
      },
    );
  };

  const unpaid = unpaidAmount > 0;

  return (
    <DialogModal
      visible={visible}
      title={
        unpaid
          ? t("orders:dialogs.forceCloseTitle")
          : t("orders:dialogs.closeTitle")
      }
      message={
        unpaid
          ? t("orders:dialogs.forceCloseMessage", {
              amount: formatCurrency(unpaidAmount),
            })
          : t("orders:dialogs.closeMessage")
      }
      confirmLabel={
        unpaid ? t("orders:options.forceCloseOrder") : t("common:actions.close")
      }
      confirmVariant={unpaid ? "destructive" : "text"}
      onConfirm={handleConfirm}
      onCancel={onClose}
      loading={isLoading}
    />
  );
}
