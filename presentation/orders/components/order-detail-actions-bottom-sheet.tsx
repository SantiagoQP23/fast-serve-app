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
  // Explains why Replace is disabled, e.g. by opening an InfoBottomSheet.
  onReplaceBlockedInfo?: () => void;
  onDelete?: () => void;
  onAddAgain?: () => void;
  // Why a cancelled item can't be added again; shown under the option.
  addAgainBlockedHint?: string;
  onClose?: () => void;
}

/**
 * An item's options. Blocked actions stay listed: Add again keeps its reason
 * under it, Replace is dimmed with an info button that explains why.
 */
const OrderDetailActionsBottomSheet = ({
  detail,
  onEditQuantity,
  onReplace,
  onReplaceBlockedInfo,
  onDelete,
  onAddAgain,
  addAgainBlockedHint,
  onClose,
}: OrderDetailActionsBottomSheetProps) => {
  const { t } = useTranslation(["common", "orders"]);

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
            disabled: !!replaceBlockReason,
            info:
              replaceBlockReason && onReplaceBlockedInfo
                ? {
                    accessibilityLabel: t(
                      "orders:replaceItem.blocked.infoLabel",
                    ),
                    onPress: onReplaceBlockedInfo,
                  }
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
      // When it's blocked, the card explains why instead of confirming.
      onPress: () => onDelete?.(),
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
