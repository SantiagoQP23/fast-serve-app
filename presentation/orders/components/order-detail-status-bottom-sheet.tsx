import { forwardRef } from "react";
import { Pressable } from "react-native";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { OrderDetailStatus } from "@/core/orders/models/order-detail.model";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

interface OrderDetailStatusBottomSheetProps {
  value: OrderDetailStatus;
  onSelectStatus: (status: OrderDetailStatus) => void;
}

interface StatusOption {
  status: OrderDetailStatus;
  icon: IconName;
  labelKey: string;
  iconColor: string;
  // The kitchen moves items through these; the waiter can't pick them.
  kitchenOnly?: boolean;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    status: OrderDetailStatus.PENDING,
    icon: "clock",
    labelKey: "common:status.pending",
    iconColor: "orange-500",
  },
  {
    status: OrderDetailStatus.IN_PROGRESS,
    icon: "flame",
    labelKey: "common:status.inProgress",
    iconColor: "blue-600",
    kitchenOnly: true,
  },
  {
    status: OrderDetailStatus.READY,
    icon: "bell",
    labelKey: "common:status.ready",
    iconColor: "emerald-600",
    kitchenOnly: true,
  },
  {
    status: OrderDetailStatus.DELIVERED,
    icon: "circle-check-big",
    labelKey: "common:status.delivered",
    iconColor: "emerald-600",
  },
];

/**
 * Picks an item's status. Kitchen-driven statuses stay listed with the reason
 * the waiter can't choose them, instead of being dimmed out.
 */
const OrderDetailStatusBottomSheet = forwardRef<
  BottomSheetMethods,
  OrderDetailStatusBottomSheetProps
>(({ value, onSelectStatus }, ref) => {
  const { t } = useTranslation(["common", "orders"]);

  return (
    <ThemedBottomSheetModal ref={ref} enablePanDownToClose>
      <BottomSheetView style={tw`px-8 pb-6`}>
        <ThemedText type="h3" style={tw`mb-4`}>
          {t("orders:detailActions.statusTitle")}
        </ThemedText>
        {STATUS_OPTIONS.map((option) => {
          const isSelected = value === option.status;
          return (
            <Pressable
              key={option.status}
              onPress={() => {
                if (option.kitchenOnly) return;
                onSelectStatus(option.status);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityHint={
                option.kitchenOnly
                  ? t("orders:detailActions.statusSetByKitchen")
                  : undefined
              }
              style={({ pressed }) =>
                tw.style(
                  "flex-row items-center gap-4 py-3 min-h-12",
                  pressed && !option.kitchenOnly && "opacity-60",
                )
              }
            >
              <Icon
                name={option.icon}
                size={22}
                color={tw.color(option.iconColor)}
              />
              <ThemedView style={tw`flex-1 bg-transparent`}>
                <ThemedText type="body1">{t(option.labelKey)}</ThemedText>
                {option.kitchenOnly && (
                  <ThemedText type="small" style={tw`text-gray-500 mt-0.5`}>
                    {t("orders:detailActions.statusSetByKitchen")}
                  </ThemedText>
                )}
              </ThemedView>
              {isSelected && (
                <Icon name="check" size={20} color={tw.color("primary")} />
              )}
            </Pressable>
          );
        })}
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
});

OrderDetailStatusBottomSheet.displayName = "OrderDetailStatusBottomSheet";

export default OrderDetailStatusBottomSheet;
