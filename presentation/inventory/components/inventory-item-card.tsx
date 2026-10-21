import Icon, { type IconName } from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Label, { LabelProps } from "@/presentation/theme/components/label";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import {
  getInventoryStockRatio,
  getInventoryStockStatus,
  type InventoryItem,
  type InventoryStockStatus,
} from "@/core/inventory/models/inventory-item.model";
import Card from "@/presentation/theme/components/card";

interface InventoryItemCardProps {
  item: InventoryItem;
  canManage: boolean;
  onPress?: (item: InventoryItem) => void;
  onOptionsPress: (item: InventoryItem) => void;
  onAdjustPress: (item: InventoryItem) => void;
  onReactivatePress: (item: InventoryItem) => void;
  selectionMode?: boolean;
  selected?: boolean;
  /** Highlights the item open in the detail pane (tablet). */
  active?: boolean;
  onLongPress?: (item: InventoryItem) => void;
  onToggleSelect?: (item: InventoryItem) => void;
}

export const INVENTORY_STATUS_STYLES: Record<
  InventoryStockStatus,
  {
    icon: IconName;
    color: string;
    badgeBg: string;
    badgeText: string;
    numberColor?: string;
  }
> = {
  critical: {
    icon: "circle-alert",
    color: "red-500",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    numberColor: "text-red-600",
  },
  low: {
    icon: "trending-down",
    color: "orange-500",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-800",
    numberColor: "text-orange-600",
  },
  optimal: {
    icon: "circle-check",
    color: "emerald-500",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800",
  },
  noMinimum: {
    icon: "circle-dashed",
    color: "gray-400",
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-600",
  },
  inactive: {
    icon: "archive",
    color: "gray-400",
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-600",
  },
};

const QUANTITY_LABEL_COLOR: Record<InventoryStockStatus, LabelProps["color"]> =
  {
    critical: "error",
    low: "warning",
    optimal: "success",
    noMinimum: "default",
    inactive: "default",
  };

export default function InventoryItemCard({
  item,
  onPress,
  selectionMode,
  selected,
  active,
  onLongPress,
  onToggleSelect,
}: InventoryItemCardProps) {
  const { t } = useTranslation("inventory");
  const status = getInventoryStockStatus(item);
  const ratio = getInventoryStockRatio(item);
  const styles = INVENTORY_STATUS_STYLES[status];
  const isInactive = status === "inactive";
  const showStockBar =
    !isInactive && !!item.minimumQuantity && item.minimumQuantity > 0;
  const quantityLabelColor = QUANTITY_LABEL_COLOR[status];

  return (
    <Card
      variant="outline"
      disabled={!onPress && !selectionMode}
      onPress={() => (selectionMode ? onToggleSelect?.(item) : onPress?.(item))}
      onLongPress={() => onLongPress?.(item)}
      style={({ pressed }) =>
        tw.style(
          " gap-3 p-4",
          isInactive && "opacity-50 border border-dashed border-border",
          active && !selectionMode && "bg-secondary",
          selected && "border border-primary bg-secondary",
          pressed && (onPress || selectionMode) && "opacity-80",
        )
      }
    >
      <ThemedView style={tw`flex-row items-start justify-between gap-3`}>
        {selectionMode && (
          <Icon
            name={selected ? "circle-check" : "circle"}
            size={22}
            color={selected ? tw.color("primary") : tw.color("gray-400")}
          />
        )}
        <ThemedView style={tw`flex-1 gap-1 flex-row`}>
          <Label
            text={t("quantityWithUnit", {
              quantity: item.quantity,
              unit: t(`units.${item.unit}`, { count: item.quantity }),
            })}
            color={quantityLabelColor}
          />
          <ThemedText
            type="body1"
            style={[{ fontFamily: typography.semibold }, tw`text-on-surface`]}
            numberOfLines={2}
          >
            {item.name}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={tw`gap-2`}>
        <ThemedView style={tw`flex-row items-baseline justify-between`}>
          {!!item.productOptionsCount ? (
            <ThemedText type="small" style={tw`text-gray-500`}>
              {t("usedInCount", { count: item.productOptionsCount })}
            </ThemedText>
          ) : (
            <ThemedView></ThemedView>
          )}
        </ThemedView>
        {/* {showStockBar && ( */}
        {/*   <ProgressBar */}
        {/*     progress={ratio} */}
        {/*     height={2} */}
        {/*     bgColor="bg-gray-100" */}
        {/*     progressColor={`bg-${styles.color}`} */}
        {/*   /> */}
        {/* )} */}
      </ThemedView>
    </Card>
  );
}
