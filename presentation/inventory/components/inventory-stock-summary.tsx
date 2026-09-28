import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import {
  getInventoryStockStatus,
  type InventoryItem,
} from "@/core/inventory/models/inventory-item.model";

interface InventoryStockSummaryProps {
  items: InventoryItem[];
}

export default function InventoryStockSummary({
  items,
}: InventoryStockSummaryProps) {
  const { t } = useTranslation("inventory");

  const counts = items.reduce(
    (acc, item) => {
      const status = getInventoryStockStatus(item);
      if (status === "critical") acc.critical += 1;
      else if (status === "low") acc.low += 1;
      else if (status === "optimal") acc.optimal += 1;
      return acc;
    },
    { critical: 0, low: 0, optimal: 0 },
  );

  const tiles = [
    {
      key: "critical",
      count: counts.critical,
      label: t("summary.critical"),
      description: t("summary.criticalDescription"),
      icon: "warning" as const,
      color: "red-500",
    },
    {
      key: "low",
      count: counts.low,
      label: t("summary.low"),
      description: t("summary.lowDescription"),
      icon: "trending-down" as const,
      color: "orange-500",
    },
    {
      key: "optimal",
      count: counts.optimal,
      label: t("summary.optimal"),
      description: t("summary.optimalDescription"),
      icon: "checkmark-circle" as const,
      color: "emerald-500",
    },
  ];

  return (
    <ThemedView style={tw`flex-row gap-2.5`}>
      {tiles.map((tile) => (
        <ThemedView
          key={tile.key}
          style={[tw`flex-1 bg-light-surface rounded-3xl p-3.5 gap-2 `]}
        >
          <ThemedView
            style={tw`flex-row items-center justify-between bg-transparent`}
          >
            <ThemedText type="small" style={tw`text-gray-500`}>
              {tile.label}
            </ThemedText>
            <Ionicons name={tile.icon} size={16} color={tw.color(tile.color)} />
          </ThemedView>
          <ThemedView style={tw`bg-transparent`}>
            <ThemedText type="h3" style={{ fontFamily: typography.bold }}>
              {tile.count}
            </ThemedText>
            <ThemedText
              type="small"
              numberOfLines={1}
              style={[
                { color: tw.color(tile.color) },
                { fontFamily: typography.semibold },
              ]}
            >
              {tile.description}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      ))}
    </ThemedView>
  );
}
