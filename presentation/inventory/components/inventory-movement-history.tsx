import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { GroupedList } from "@/presentation/theme/components/grouped-list";
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
  {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    textColor: string;
  }
> = {
  [InventoryMovementType.MANUAL_RESTOCK]: {
    icon: "add-outline",
    iconColor: "emerald-500",
    textColor: "text-emerald-600",
  },
  [InventoryMovementType.MANUAL_ADJUSTMENT]: {
    icon: "remove-outline",
    iconColor: "red-500",
    textColor: "text-red-600",
  },
  [InventoryMovementType.ORDER_DELIVERED]: {
    icon: "trending-down-outline",
    iconColor: "blue-500",
    textColor: "text-blue-600",
  },
  [InventoryMovementType.ORDER_DELIVERY_REVERSED]: {
    icon: "arrow-undo-outline",
    iconColor: "emerald-500",
    textColor: "text-emerald-600",
  },
  [InventoryMovementType.ORDER_CREATED]: {
    icon: "trending-down-outline",
    iconColor: "blue-500",
    textColor: "text-blue-600",
  },
  [InventoryMovementType.ORDER_CREATED_REVERSED]: {
    icon: "arrow-undo-outline",
    iconColor: "emerald-500",
    textColor: "text-emerald-600",
  },
  [InventoryMovementType.SALE_DIRECT]: {
    icon: "trending-down-outline",
    iconColor: "blue-500",
    textColor: "text-blue-600",
  },
  [InventoryMovementType.SALE_DIRECT_CANCELLED]: {
    icon: "arrow-undo-outline",
    iconColor: "emerald-500",
    textColor: "text-emerald-600",
  },
};

// Movement direction is a property of the type, not the sign the backend
// happens to send — some movement types are reported as absolute quantities.
const INCREASE_TYPES = new Set<InventoryMovementType>([
  InventoryMovementType.MANUAL_RESTOCK,
  InventoryMovementType.ORDER_DELIVERY_REVERSED,
  InventoryMovementType.ORDER_CREATED_REVERSED,
  InventoryMovementType.SALE_DIRECT_CANCELLED,
]);

// Fallback for a movement type the frontend doesn't recognize (e.g. a type
// the backend added that this map hasn't been updated for yet).
const DEFAULT_VISUAL: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  textColor: string;
} = {
  icon: "swap-horizontal-outline",
  iconColor: "gray-500",
  textColor: "text-gray-600",
};

export default function InventoryMovementHistory({
  movements,
  unit,
}: InventoryMovementHistoryProps) {
  const { t } = useTranslation("inventory");

  return (
    <ThemedView style={tw`gap-3 bg-transparent mt-4`}>
      <ThemedText type="body1" style={[{}, tw`px-1`]}>
        {t("detail.movementHistory")}
      </ThemedText>

      {movements.length === 0 ? (
        <ThemedView style={tw`bg-white rounded-3xl p-6 shadow-xs`}>
          <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
            {t("detail.noMovements")}
          </ThemedText>
        </ThemedView>
      ) : (
        <GroupedList
          data={movements}
          keyExtractor={(movement) => movement.id}
          renderItem={(movement) => {
            const visual = MOVEMENT_VISUALS[movement.type] ?? DEFAULT_VISUAL;
            const isIncrease = INCREASE_TYPES.has(movement.type)
              ? true
              : MOVEMENT_VISUALS[movement.type]
                ? false
                : movement.quantity >= 0;

            return (
              <ThemedView
                style={tw`flex-row items-center justify-between bg-transparent`}
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
                      color={tw.color(visual.iconColor)}
                    />
                  </ThemedView>
                  <ThemedView style={tw`gap-0.5 flex-1 bg-transparent`}>
                    <ThemedText
                      type="body2"
                      style={{ fontFamily: typography.medium }}
                    >
                      {t(`movementTypes.${movement.type}`, {
                        defaultValue: movement.type,
                      })}
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
                  type="body2"
                  style={[
                    { fontFamily: typography.semibold },
                    tw.style(visual.textColor),
                  ]}
                >
                  {isIncrease ? "+" : "-"}
                  {Math.abs(movement.quantity)} {unit}
                </ThemedText>
              </ThemedView>
            );
          }}
        />
      )}
    </ThemedView>
  );
}
