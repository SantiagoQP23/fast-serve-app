import { Text } from "react-native";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { InventoryUnit } from "@/core/inventory/models/inventory-item.model";

export interface InventoryCardLine {
  id: string;
  name: string;
  /** Amount in the item's unit; omitted for lines with nothing to show yet. */
  quantity?: number | null;
  unit: InventoryUnit;
  /** Text before the amount, e.g. "+" for a purchase. */
  prefix?: string;
  icon?: IconName;
  iconColor?: string;
  /** Short text after the name, e.g. a count difference, with its color class. */
  trailing?: { text: string; colorClass: string };
}

interface InventoryCardLinesProps {
  lines: InventoryCardLine[];
  /** All lines of the count or purchase, to summarize the ones not shown. */
  total: number;
}

/**
 * The first lines of a count or purchase on its history card, styled like
 * the compact order card: gray amount before the name, then "+N más".
 */
export default function InventoryCardLines({
  lines,
  total,
}: InventoryCardLinesProps) {
  const { t } = useTranslation("inventory");
  const hiddenCount = total - lines.length;
  const hasIcons = lines.some((line) => line.icon);

  if (lines.length === 0) return null;

  // Units read like the order card ("2×"); weights and volumes keep their unit.
  const formatQuantity = (quantity: number, unit: InventoryUnit) =>
    unit === InventoryUnit.UNIT
      ? `${quantity}×`
      : t("quantityWithUnit", { quantity, unit: t(`units.${unit}`) });

  return (
    <ThemedView style={tw`gap-2 bg-transparent`}>
      {lines.map((line) => (
        <ThemedView key={line.id} style={tw`flex-row gap-2 bg-transparent`}>
          {line.icon && (
            <Icon
              name={line.icon}
              size={16}
              color={line.iconColor ?? tw.color("gray-500")}
              style={tw`mt-[2px]`}
            />
          )}
          <ThemedText
            type="body2"
            numberOfLines={1}
            style={[
              tw`flex-1 text-on-surface`,
              { fontFamily: typography.medium },
            ]}
          >
            {line.quantity != null && (
              <Text
                style={[tw`text-gray-500`, { fontVariant: ["tabular-nums"] }]}
              >
                {line.prefix ?? ""}
                {formatQuantity(line.quantity, line.unit)}{" "}
              </Text>
            )}
            {line.name}
            {line.trailing && (
              <Text style={tw`${line.trailing.colorClass}`}>
                {` (${line.trailing.text})`}
              </Text>
            )}
          </ThemedText>
        </ThemedView>
      ))}
      {hiddenCount > 0 && (
        <ThemedText
          type="small"
          style={tw.style("text-gray-500", hasIcons && "pl-6")}
        >
          {t("cards.moreItems", { count: hiddenCount })}
        </ThemedText>
      )}
    </ThemedView>
  );
}
