import DialogModal from "@/presentation/theme/components/dialog-modal";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { Order } from "@/core/orders/models/order.model";
import { useOrders } from "../hooks/useOrders";

interface CloseOrderModalProps {
  order: Order | null | undefined;
  visible: boolean;
  onClose: () => void;
  onClosed?: () => void;
}

export default function CloseOrderModal({
  order,
  visible,
  onClose,
  onClosed,
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

  return (
    <DialogModal
      visible={visible}
      title={t("orders:dialogs.closeTitle")}
      message={t("orders:dialogs.closeMessage")}
      confirmLabel={t("common:actions.close")}
      onConfirm={handleConfirm}
      onCancel={onClose}
      loading={isLoading}
    />
  );
}
