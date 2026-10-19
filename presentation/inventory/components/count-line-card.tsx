import { Pressable } from "react-native";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import {
  InventoryCountItemStatus,
  isCountItemAnswered,
  type InventoryCountItem,
} from "@/core/inventory/models/inventory-count.model";
import { getCountStatusIcon } from "./count-status-icon";

interface CountLineCardProps {
  line: InventoryCountItem;
  onPress?: () => void;
  /** Highlights the line currently open next to the list (tablet). */
  active?: boolean;
}

/**
 * One counted product as a flat row, like an order's items: a status icon,
 * the name and, when answered, system vs counted amounts.
 */
export default function CountLineCard({
  line,
  onPress,
  active,
}: CountLineCardProps) {
  const { t } = useTranslation("inventory");
  const unit = t(`units.${line.inventoryItem.unit}`);
  const difference = line.difference ?? 0;
  const { icon, iconColor } = getCountStatusIcon(line.status);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      // The bleed keeps the text on the screen's gutter while the active
      // highlight and the press area get room around it.
      style={({ pressed }) =>
        tw.style(
          "flex-row gap-4 -mx-3 px-3 py-2 rounded-2xl",
          active && "bg-secondary",
          pressed && "opacity-70",
        )
      }
    >
      <Icon name={icon} size={20} color={iconColor} style={tw`mt-0.5`} />
      <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
        <ThemedText type="body1" numberOfLines={2}>
          {line.inventoryItem.name}
        </ThemedText>
        <ThemedText type="body2" style={tw`text-gray-500`}>
          {isCountItemAnswered(line)
            ? t("counts.lineQuantities", {
                expected: line.expectedQuantity,
                counted: line.countedQuantity,
                unit,
              })
            : line.status === InventoryCountItemStatus.SKIPPED
              ? t("counts.status.SKIPPED")
              : t("counts.notCounted")}
          {isCountItemAnswered(line) && difference !== 0 && (
            <ThemedText
              type="body2"
              style={tw`${difference > 0 ? "text-emerald-700" : "text-red-700"}`}
            >
              {` (${difference > 0 ? "+" : ""}${difference})`}
            </ThemedText>
          )}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}
