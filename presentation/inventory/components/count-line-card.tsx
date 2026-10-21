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
 * the name and, when the count is off, system vs counted amounts.
 */
export default function CountLineCard({
  line,
  onPress,
  active,
}: CountLineCardProps) {
  const { t } = useTranslation("inventory");
  const difference = line.difference ?? 0;
  const answered = isCountItemAnswered(line);
  // Matching lines are just the name; the quantities only matter when off.
  const hasDifference = difference !== 0;
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
          "flex-row gap-4 -mx-3 px-3 py-2 rounded-md",
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
        {answered ? (
          hasDifference && (
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("counts.lineQuantities", {
                expected: line.expectedQuantity,
                counted: line.countedQuantity,
                unit: t(`units.${line.inventoryItem.unit}`, {
                  count: line.countedQuantity ?? 0,
                }),
              })}
              <ThemedText
                type="body2"
                style={tw`${difference > 0 ? "text-emerald-700" : "text-red-700"}`}
              >
                {` (${difference > 0 ? "+" : ""}${difference})`}
              </ThemedText>
            </ThemedText>
          )
        ) : (
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {line.status === InventoryCountItemStatus.SKIPPED
              ? t("counts.status.SKIPPED")
              : t("counts.notCounted")}
          </ThemedText>
        )}
      </ThemedView>
    </Pressable>
  );
}
