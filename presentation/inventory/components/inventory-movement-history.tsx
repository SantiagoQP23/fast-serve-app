import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import {
  InventoryMovementType,
  type InventoryMovement,
} from "@/core/inventory/models/inventory-movement.model";

interface InventoryMovementHistoryProps {
  movements: InventoryMovement[];
  unit: string;
}

const MOVEMENT_VISUALS: Record<
  InventoryMovementType,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  [InventoryMovementType.MANUAL_RESTOCK]: {
    icon: "add-outline",
    color: "emerald-500",
  },
  [InventoryMovementType.MANUAL_ADJUSTMENT]: {
    icon: "remove-outline",
    color: "red-500",
  },
  [InventoryMovementType.ORDER_DELIVERED]: {
    icon: "trending-down-outline",
    color: "blue-500",
  },
  [InventoryMovementType.ORDER_DELIVERY_REVERSED]: {
    icon: "arrow-undo-outline",
    color: "emerald-500",
  },
  [InventoryMovementType.SALE_DIRECT]: {
    icon: "trending-down-outline",
    color: "blue-500",
  },
  [InventoryMovementType.SALE_DIRECT_CANCELLED]: {
    icon: "arrow-undo-outline",
    color: "emerald-500",
  },
};

export default function InventoryMovementHistory({
  movements,
  unit,
}: InventoryMovementHistoryProps) {
  const { t } = useTranslation("inventory");

  return (
    <ThemedView style={tw`bg-light-surface rounded-3xl p-6 shadow-xs`}>
      <ThemedText
        type="body1"
        style={[{ fontFamily: typography.bold }, tw`mb-3`]}
      >
        {t("detail.movementHistory")}
      </ThemedText>

      {movements.length === 0 ? (
        <ThemedText type="body2" style={tw`text-gray-500 py-2`}>
          {t("detail.noMovements")}
        </ThemedText>
      ) : (
        movements.map((movement, index) => {
          const visual = MOVEMENT_VISUALS[movement.type];
          const isLast = index === movements.length - 1;
          const isPositive = movement.quantity > 0;
          const isWaste =
            movement.type === InventoryMovementType.MANUAL_ADJUSTMENT &&
            !isPositive;

          return (
            <ThemedView
              key={movement.id}
              style={tw.style(
                "flex-row items-center justify-between py-3.5 border-b border-light-divider",
                isLast && "border-b-0",
              )}
            >
              <ThemedView
                style={tw`flex-row items-center gap-3 flex-1 bg-transparent`}
              >
                <ThemedView
                  style={tw`w-9 h-9 rounded-full bg-light-background items-center justify-center shadow-xs`}
                >
                  <Ionicons
                    name={visual.icon}
                    size={18}
                    color={tw.color(visual.color)}
                  />
                </ThemedView>
                <ThemedView style={tw`gap-0.5 flex-1 bg-transparent`}>
                  <ThemedText
                    type="body2"
                    style={{ fontFamily: typography.medium }}
                  >
                    {t(`movementTypes.${movement.type}`)}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={tw`text-gray-500`}
                    numberOfLines={1}
                  >
                    {dayjs(movement.createdAt).format("MMM D, HH:mm")}
                    {movement.note ? ` · ${movement.note}` : ""}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              <ThemedText
                type="body1"
                style={[
                  { fontFamily: typography.semibold },
                  isPositive
                    ? tw`text-emerald-600`
                    : isWaste
                      ? tw`text-red-600`
                      : undefined,
                ]}
              >
                {isPositive ? "+" : ""}
                {movement.quantity} {unit}
              </ThemedText>
            </ThemedView>
          );
        })
      )}
    </ThemedView>
  );
}
