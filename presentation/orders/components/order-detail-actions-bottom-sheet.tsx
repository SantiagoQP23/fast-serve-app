import { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { Alert, Pressable } from "react-native";
import {
  OrderDetail,
  OrderDetailStatus,
  getReplaceBlockReason,
} from "@/core/orders/models/order-detail.model";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

interface OrderDetailActionsBottomSheetProps {
  detail: OrderDetail;
  onEditQuantity?: () => void;
  onReplace?: () => void;
  onDelete?: () => void;
  onAddAgain?: () => void;
  // Why a cancelled item can't be added again; the option is disabled.
  addAgainBlockedHint?: string;
  onClose?: () => void;
}

interface OptionItem {
  icon: IconName;
  label: string;
  hint?: string;
  color?: string;
  onPress: () => void;
  disabled?: boolean;
}

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

  const handleDelete = () => {
    if (detail.qtyDelivered > 0) {
      Alert.alert(
        t("orders:dialogs.cannotDeleteItemTitle"),
        t("orders:dialogs.cannotDeleteItemMessage"),
      );
      return;
    }
    onDelete?.();
  };

  const handleEditQuantity = () => {
    onEditQuantity?.();
    onClose?.();
  };

  const replaceBlockReason = getReplaceBlockReason(detail);

  const handleReplace = () => {
    if (replaceBlockReason) return;
    onClose?.();
    onReplace?.();
  };

  const handleAddAgain = () => {
    if (addAgainBlockedHint) return;
    onClose?.();
    onAddAgain?.();
  };

  const productLabel = `${detail.quantity} × ${detail.product.name}${
    detail.productOption && detail.product.options.length > 1
      ? ` · ${detail.productOption.name}`
      : ""
  }`;

  // A cancelled item can only be added again; everything else is for live items.
  const cancelledOptions: OptionItem[] = onAddAgain
    ? [
        {
          icon: "undo-2",
          label: t("orders:detailActions.addAgain"),
          hint: addAgainBlockedHint ?? productLabel,
          onPress: handleAddAgain,
          disabled: !!addAgainBlockedHint,
        },
      ]
    : [];

  const activeOptions: OptionItem[] = [
    {
      icon: "square-pen",
      label: t("orders:detailActions.editQuantity"),
      onPress: handleEditQuantity,
    },
    ...(onReplace
      ? [
          {
            icon: "arrow-left-right" as const,
            label: t("orders:detailActions.replaceItem"),
            hint: replaceBlockReason
              ? t(`orders:replaceItem.reasons.${replaceBlockReason}`)
              : undefined,
            onPress: handleReplace,
          },
        ]
      : []),
    {
      icon: "trash",
      label: t("orders:detailActions.deleteItem"),
      color: "text-red-500",
      onPress: handleDelete,
      disabled: detail.qtyDelivered > 0,
    },
  ];

  const options =
    detail.status === OrderDetailStatus.CANCELLED
      ? cancelledOptions
      : activeOptions;

  return (
    <BottomSheetView style={tw`px-4 pb-6`}>
      <ThemedView style={tw`gap-2`}>
        {options.map((option, index) => (
          <ThemedView key={index}>
            <Pressable
              onPress={option.onPress}
              disabled={option.disabled}
              style={({ pressed }) => [
                tw.style(
                  "flex-row items-center gap-3 p-3 rounded-xl",
                  pressed && !option.disabled && "bg-gray-100",
                  option.disabled && "opacity-40",
                ),
              ]}
            >
              <Icon
                name={option.icon}
                size={22}
                color={
                  option.disabled
                    ? tw.color("gray-400")
                    : option.color
                      ? tw.color(option.color.replace("text-", ""))
                      : tw.color("gray-700")
                }
              />
              <ThemedView style={tw`flex-1`}>
                <ThemedText
                  type="body1"
                  style={tw.style(
                    option.color && !option.disabled && option.color,
                  )}
                >
                  {option.label}
                </ThemedText>
                {option.hint && (
                  <ThemedText type="small" style={tw`text-gray-500 mt-0.5`}>
                    {option.hint}
                  </ThemedText>
                )}
              </ThemedView>
            </Pressable>
          </ThemedView>
        ))}
      </ThemedView>
    </BottomSheetView>
  );
};

export default OrderDetailActionsBottomSheet;
