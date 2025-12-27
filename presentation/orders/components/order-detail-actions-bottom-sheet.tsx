import { BottomSheetView } from "@gorhom/bottom-sheet";
import { Alert, Pressable } from "react-native";
import { OrderDetail } from "@/core/orders/models/order-detail.model";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

interface OrderDetailActionsBottomSheetProps {
  detail: OrderDetail;
  onEditQuantity?: () => void;
  onDelete?: () => void;
  onClose?: () => void;
}

interface OptionItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
  onPress: () => void;
  disabled?: boolean;
}

const OrderDetailActionsBottomSheet = ({
  detail,
  onEditQuantity,
  onDelete,
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

  const options: OptionItem[] = [
    {
      icon: "create-outline",
      label: t("orders:detailActions.editQuantity"),
      onPress: handleEditQuantity,
    },
    {
      icon: "trash-outline",
      label: t("orders:detailActions.deleteItem"),
      color: "text-red-500",
      onPress: handleDelete,
      disabled: detail.qtyDelivered > 0,
    },
  ];

  return (
    <BottomSheetView style={tw`px-4 pb-6`}>
      <ThemedView style={tw`mb-4`}>
        <ThemedText type="h3">{t("orders:detailActions.title")}</ThemedText>
        <ThemedText type="body2" style={tw`text-gray-500 mt-1`}>
          {detail.product.name}
        </ThemedText>
      </ThemedView>

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
              <Ionicons
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
              <ThemedText
                type="body1"
                style={tw.style(
                  "flex-1",
                  option.color && !option.disabled && option.color,
                )}
              >
                {option.label}
              </ThemedText>
              {!option.disabled && (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={tw.color("gray-400")}
                />
              )}
            </Pressable>
          </ThemedView>
        ))}
      </ThemedView>
    </BottomSheetView>
  );
};

export default OrderDetailActionsBottomSheet;
