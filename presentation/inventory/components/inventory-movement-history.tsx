import { useMemo, useState, type ReactNode } from "react";
import { Pressable } from "react-native";
import { router } from "expo-router";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import dayjs from "dayjs";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import {
  DetailCard,
  DetailSectionTitle,
} from "@/presentation/theme/components/detail-card";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import type { InventoryUnit } from "@/core/inventory/models/inventory-item.model";
import { groupByDay } from "@/core/i18n/utils";
import DaySectionHeader from "@/presentation/inventory/components/day-section-header";
import Skeleton from "@/presentation/theme/components/skeleton";
import {
  getMovementCreatorName,
  InventoryMovementSourceType,
  InventoryMovementType,
  type InventoryMovement,
} from "@/core/inventory/models/inventory-movement.model";

interface InventoryMovementHistoryProps {
  movements: InventoryMovement[];
  unit: InventoryUnit;
  loading?: boolean;
  /** Shown instead of the empty state when the history failed to load. */
  error?: string;
}

/** Recent movements shown before "See all", so the screen stays short. */
const INITIAL_VISIBLE = 10;

/**
 * Where a movement came from, when the app has a screen for it. Order and
 * bill movements reference a line, not the order, so they don't open.
 */
function openMovementSource(movement: InventoryMovement) {
  if (!movement.sourceId) return;
  if (movement.sourceType === InventoryMovementSourceType.PURCHASE) {
    router.push({
      pathname: "/(profile)/inventory/purchases/detail",
      params: { purchaseId: movement.sourceId },
    });
  } else if (
    movement.sourceType === InventoryMovementSourceType.INVENTORY_COUNT
  ) {
    router.push({
      pathname: "/(profile)/inventory/counts/detail",
      params: { countId: movement.sourceId },
    });
  }
}

const hasSourceScreen = (movement: InventoryMovement) =>
  !!movement.sourceId &&
  (movement.sourceType === InventoryMovementSourceType.PURCHASE ||
    movement.sourceType === InventoryMovementSourceType.INVENTORY_COUNT);

const MOVEMENT_VISUALS: Record<
  InventoryMovementType,
  {
    icon: IconName;
    iconColor: string;
    textColor: string;
  }
> = {
  [InventoryMovementType.MANUAL_RESTOCK]: {
    icon: "plus",
    iconColor: "emerald-500",
    textColor: "text-emerald-600",
  },
  [InventoryMovementType.MANUAL_ADJUSTMENT]: {
    icon: "minus",
    iconColor: "gray-500",
    textColor: "text-on-surface",
  },
  [InventoryMovementType.ORDER_DELIVERED]: {
    icon: "trending-down",
    iconColor: "gray-500",
    textColor: "text-on-surface",
  },
  [InventoryMovementType.ORDER_DELIVERY_REVERSED]: {
    icon: "undo-2",
    iconColor: "emerald-500",
    textColor: "text-emerald-600",
  },
  [InventoryMovementType.ORDER_CREATED]: {
    icon: "trending-down",
    iconColor: "gray-500",
    textColor: "text-on-surface",
  },
  [InventoryMovementType.ORDER_CREATED_REVERSED]: {
    icon: "undo-2",
    iconColor: "emerald-500",
    textColor: "text-emerald-600",
  },
  [InventoryMovementType.SALE_DIRECT]: {
    icon: "trending-down",
    iconColor: "gray-500",
    textColor: "text-on-surface",
  },
  [InventoryMovementType.SALE_DIRECT_CANCELLED]: {
    icon: "undo-2",
    iconColor: "emerald-500",
    textColor: "text-emerald-600",
  },
  [InventoryMovementType.PURCHASE]: {
    icon: "shopping-cart",
    iconColor: "emerald-500",
    textColor: "text-emerald-600",
  },
  [InventoryMovementType.PURCHASE_REVERSED]: {
    icon: "undo-2",
    iconColor: "gray-500",
    textColor: "text-on-surface",
  },
  [InventoryMovementType.INVENTORY_COUNT_INCREASE]: {
    icon: "clipboard",
    iconColor: "emerald-500",
    textColor: "text-emerald-600",
  },
  // A count shortage is stock that went missing — worth a warning, unlike
  // routine decreases (sales, orders, manual), which stay neutral ink.
  [InventoryMovementType.INVENTORY_COUNT_DECREASE]: {
    icon: "clipboard",
    iconColor: "orange-500",
    textColor: "text-orange-700",
  },
};

// Movement direction is a property of the type, not the sign the backend
// happens to send — some movement types are reported as absolute quantities.
const INCREASE_TYPES = new Set<InventoryMovementType>([
  InventoryMovementType.MANUAL_RESTOCK,
  InventoryMovementType.ORDER_DELIVERY_REVERSED,
  InventoryMovementType.ORDER_CREATED_REVERSED,
  InventoryMovementType.SALE_DIRECT_CANCELLED,
  InventoryMovementType.PURCHASE,
  InventoryMovementType.INVENTORY_COUNT_INCREASE,
]);

// Fallback for a movement type the frontend doesn't recognize (e.g. a type
// the backend added that this map hasn't been updated for yet).
const DEFAULT_VISUAL: {
  icon: IconName;
  iconColor: string;
  textColor: string;
} = {
  icon: "arrow-left-right",
  iconColor: "gray-500",
  textColor: "text-gray-600",
};

/** One movement: what happened, when and by whom, and how much it moved. */
function MovementRow({
  movement,
  unit,
}: {
  movement: InventoryMovement;
  unit: InventoryUnit;
}) {
  const { t } = useTranslation("inventory");
  const visual = MOVEMENT_VISUALS[movement.type] ?? DEFAULT_VISUAL;
  const isIncrease = INCREASE_TYPES.has(movement.type)
    ? true
    : MOVEMENT_VISUALS[movement.type]
      ? false
      : movement.quantity >= 0;

  const creator = getMovementCreatorName(movement);
  const detail = [
    dayjs(movement.createdAt).format("HH:mm"),
    movement.reason
      ? t(`adjust.reasons.${movement.reason}`, {
          defaultValue: movement.reason,
        })
      : null,
    movement.note,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ThemedView
      style={tw`flex-row items-center justify-between bg-transparent`}
    >
      <ThemedView style={tw`flex-row items-center gap-3 flex-1 bg-transparent`}>
        <ThemedView
          style={tw`w-9 h-9 rounded-full bg-surface-container-low items-center justify-center`}
        >
          <Icon
            name={visual.icon}
            size={18}
            color={tw.color(visual.iconColor)}
          />
        </ThemedView>
        <ThemedView style={tw`gap-0.5 flex-1 bg-transparent`}>
          <ThemedText type="body2" style={{ fontFamily: typography.medium }}>
            {t(`movementTypes.${movement.type}`, {
              defaultValue: movement.type,
            })}
          </ThemedText>
          <ThemedText type="small" style={tw`text-gray-500`} numberOfLines={1}>
            {detail}
          </ThemedText>
          {creator && (
            <ThemedText
              type="small"
              style={tw`text-gray-500`}
              numberOfLines={1}
            >
              {t("detail.movementBy", { name: creator })}
            </ThemedText>
          )}
        </ThemedView>
      </ThemedView>
      <ThemedView style={tw`items-end gap-0.5 bg-transparent`}>
        <ThemedText
          type="body2"
          style={[
            { fontFamily: typography.semibold },
            tw.style(visual.textColor),
          ]}
        >
          {isIncrease ? "+" : "-"}
          {t("quantityWithUnit", {
            quantity: Math.abs(movement.quantity),
            unit: t(`units.${unit}`, {
              count: Math.abs(movement.quantity),
            }),
          })}
        </ThemedText>
        {movement.quantityAfter != null && (
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("detail.quantityLeft", {
              quantity: movement.quantityAfter,
              unit: t(`units.${unit}`, {
                count: movement.quantityAfter,
              }),
            })}
          </ThemedText>
        )}
      </ThemedView>
      {hasSourceScreen(movement) && (
        <Icon
          name="chevron-right"
          size={18}
          color={tw.color("gray-400")}
          style={tw`ml-2`}
        />
      )}
    </ThemedView>
  );
}

export default function InventoryMovementHistory({
  movements,
  unit,
  loading,
  error,
}: InventoryMovementHistoryProps) {
  const { t } = useTranslation("inventory");
  const [showAll, setShowAll] = useState(false);
  const visible = useMemo(
    () => (showAll ? movements : movements.slice(0, INITIAL_VISIBLE)),
    [movements, showAll],
  );
  // Movements arrive newest first, so each day's group keeps that order.
  const days = useMemo(
    () => groupByDay(visible, (movement) => movement.createdAt),
    [visible],
  );
  const message = (text: string, color: string) => (
    <ThemedText type="body2" style={tw.style(color, "text-center py-4")}>
      {text}
    </ThemedText>
  );

  // Loading, error and empty states, in a card like the days
  let state: ReactNode = null;
  if (loading)
    state = (
      <ThemedView style={tw`gap-1 py-3 bg-transparent`}>
        <Skeleton style={tw`h-16`} />
        <Skeleton style={tw`h-16`} />
      </ThemedView>
    );
  else if (error && movements.length === 0)
    state = message(error, "text-red-600");
  else if (movements.length === 0)
    state = message(t("detail.noMovements"), "text-gray-500");

  return (
    <ThemedView style={tw`gap-3 mt-4 bg-transparent`}>
      <DetailSectionTitle title={t("detail.movementHistory")} />

      {state ? (
        <DetailCard style={tw`py-2`}>{state}</DetailCard>
      ) : (
        days.map(({ day, items }) => (
          <ThemedView key={day} style={tw`gap-2 bg-transparent`}>
            <DaySectionHeader day={day} />
            <DetailCard style={tw`py-2`}>
              {items.map((movement, index) => (
                <Pressable
                  key={movement.id}
                  onPress={() => openMovementSource(movement)}
                  disabled={!hasSourceScreen(movement)}
                  accessibilityRole={
                    hasSourceScreen(movement) ? "button" : undefined
                  }
                  style={({ pressed }) => [
                    tw`py-3`,
                    index < items.length - 1 && tw`border-b border-divider`,
                    pressed && tw`opacity-60`,
                  ]}
                >
                  <MovementRow movement={movement} unit={unit} />
                </Pressable>
              ))}
            </DetailCard>
          </ThemedView>
        ))
      )}

      {movements.length > INITIAL_VISIBLE && (
        <Pressable
          onPress={() => setShowAll((value) => !value)}
          accessibilityRole="button"
          style={({ pressed }) =>
            tw.style("self-center py-2 px-4", pressed && "opacity-70")
          }
        >
          <ThemedText
            type="body2"
            style={[tw`text-primary`, { fontFamily: typography.semibold }]}
          >
            {showAll
              ? t("detail.showLess")
              : t("detail.showAll", { count: movements.length })}
          </ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
}
