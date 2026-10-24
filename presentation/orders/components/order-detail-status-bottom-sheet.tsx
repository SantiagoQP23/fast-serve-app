import { forwardRef, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { OrderDetailStatus } from "@/core/orders/models/order-detail.model";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import InfoBottomSheet from "@/presentation/theme/components/info-bottom-sheet";
import IconButton from "@/presentation/theme/components/icon-button";
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
 * Picks an item's status. Kitchen-driven statuses show disabled, with an info
 * button explaining why the waiter can't choose them.
 */
const OrderDetailStatusBottomSheet = forwardRef<
  BottomSheetMethods,
  OrderDetailStatusBottomSheetProps
>(({ value, onSelectStatus }, ref) => {
  const { t } = useTranslation(["common", "orders"]);
  const blockedSheetRef = useRef<BottomSheetMethods>(null);
  const [blockedStatus, setBlockedStatus] = useState<OrderDetailStatus | null>(
    null,
  );

  const explainBlocked = (status: OrderDetailStatus) => {
    setBlockedStatus(status);
    blockedSheetRef.current?.present();
  };

  return (
    <>
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
                disabled={option.kitchenOnly}
                onPress={() => onSelectStatus(option.status)}
                accessibilityRole="radio"
                accessibilityState={{
                  selected: isSelected,
                  disabled: !!option.kitchenOnly,
                }}
                accessibilityHint={
                  option.kitchenOnly
                    ? t("orders:detailActions.statusSetByKitchen")
                    : undefined
                }
                style={({ pressed }) =>
                  tw.style(
                    "flex-row items-center gap-4 py-3 min-h-12",
                    pressed && "opacity-60",
                  )
                }
              >
                {/* Dim the option, not the info button, which stays usable. */}
                <View
                  style={tw.style(
                    "flex-1 flex-row items-center gap-4",
                    option.kitchenOnly && "opacity-40",
                  )}
                >
                  <Icon
                    name={option.icon}
                    size={22}
                    color={tw.color(option.iconColor)}
                  />
                  <ThemedText type="body1" style={tw`flex-1`}>
                    {t(option.labelKey)}
                  </ThemedText>
                  {isSelected && (
                    <Icon name="check" size={20} color={tw.color("primary")} />
                  )}
                </View>
                {option.kitchenOnly && (
                  <IconButton
                    icon="info"
                    size={22}
                    onPress={() => explainBlocked(option.status)}
                    accessibilityLabel={t("orders:statusBlocked.infoLabel")}
                    style={tw`-my-3 -mr-3`}
                  />
                )}
              </Pressable>
            );
          })}
        </BottomSheetView>
      </ThemedBottomSheetModal>

      <InfoBottomSheet
        ref={blockedSheetRef}
        title={t("orders:statusBlocked.title")}
        message={
          blockedStatus
            ? t(`orders:statusBlocked.reasons.${blockedStatus}`)
            : ""
        }
      />
    </>
  );
});

OrderDetailStatusBottomSheet.displayName = "OrderDetailStatusBottomSheet";

export default OrderDetailStatusBottomSheet;
