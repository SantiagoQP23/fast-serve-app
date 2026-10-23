import {
  OrderDetail,
  OrderDetailStatus,
  getReplaceBlockReason,
} from "@/core/orders/models/order-detail.model";
import ActionsBottomSheet, {
  type ActionsBottomSheetItem,
} from "@/presentation/theme/components/actions-bottom-sheet";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

interface OrderDetailActionsBottomSheetProps {
  detail: OrderDetail;
  onEditQuantity?: () => void;
  onReplace?: () => void;
  onDelete?: () => void;
  onAddAgain?: () => void;
  // Why a cancelled item can't be added again; shown under the option.
  addAgainBlockedHint?: string;
  onClose?: () => void;
}

/**
 * An item's options. Blocked actions stay listed and tappable-looking, with
 * the reason under them; tapping one does nothing.
 */
const OrderDetailActionsBottomSheet = ({
  detail,
  onEditQuantity,
  onReplace,
  onDelete,
  onAddAgain,
  addAgainBlockedHint,
  onClose,
}: OrderDetailActionsBottomSheetProps) => {
  const { t } = useTranslation(["common", "orders"]);

  const deleteBlocked = detail.qtyDelivered > 0;
  const replaceBlockReason = getReplaceBlockReason(detail);

  const productLabel = `${detail.quantity} × ${detail.product.name}${
    detail.productOption && detail.product.options.length > 1
      ? ` · ${detail.productOption.name}`
      : ""
  }`;

  // A cancelled item can only be added again; everything else is for live items.
  const cancelledOptions: ActionsBottomSheetItem[] = onAddAgain
    ? [
        {
          icon: "undo-2",
          label: t("orders:detailActions.addAgain"),
          hint: addAgainBlockedHint,
          onPress: () => {
            if (addAgainBlockedHint) return;
            onClose?.();
            onAddAgain();
          },
        },
      ]
    : [];

  const activeOptions: ActionsBottomSheetItem[] = [
    {
      icon: "square-pen",
      label: t("orders:detailActions.editQuantity"),
      onPress: () => {
        onEditQuantity?.();
        onClose?.();
      },
    },
    ...(onReplace
      ? [
          {
            icon: "arrow-left-right" as const,
            label: t("orders:detailActions.replaceItem"),
            hint: replaceBlockReason
              ? t(`orders:replaceItem.reasons.${replaceBlockReason}`)
              : undefined,
            onPress: () => {
              if (replaceBlockReason) return;
              onClose?.();
              onReplace();
            },
          },
        ]
      : []),
  ];

  const dangerOptions: ActionsBottomSheetItem[] = [
    {
      icon: "trash",
      label: t("orders:detailActions.deleteItem"),
      color: "text-red-600",
      hint: deleteBlocked ? t("orders:detailActions.deleteBlocked") : undefined,
      onPress: () => {
        if (deleteBlocked) return;
        onDelete?.();
      },
    },
  ];

  const isCancelled = detail.status === OrderDetailStatus.CANCELLED;

  return (
    <ActionsBottomSheet
      title={productLabel}
      sections={
        isCancelled
          ? [{ items: cancelledOptions }]
          : [{ items: activeOptions }, { items: dangerOptions }]
      }
    />
  );
};

export default OrderDetailActionsBottomSheet;
