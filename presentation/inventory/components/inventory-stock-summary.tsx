import { Pressable } from "react-native";
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
import { InventoryItemStockStatusFilter } from "@/presentation/inventory/interfaces/dto/find-all-inventory-items.dto";

interface InventoryStockSummaryProps {
  items: InventoryItem[];
  selectedStatus: InventoryItemStockStatusFilter | null;
  onSelectStatus: (status: InventoryItemStockStatusFilter | null) => void;
}

export default function InventoryStockSummary({
  items,
  selectedStatus,
  onSelectStatus,
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
      key: InventoryItemStockStatusFilter.CRITICAL,
      count: counts.critical,
      label: t("summary.critical"),
      description: t("summary.criticalDescription"),
      icon: "warning" as const,
      color: "red-500",
    },
    {
      key: InventoryItemStockStatusFilter.LOW,
      count: counts.low,
      label: t("summary.low"),
      description: t("summary.lowDescription"),
      icon: "trending-down" as const,
      color: "orange-500",
    },
    {
      key: InventoryItemStockStatusFilter.OPTIMAL,
      count: counts.optimal,
      label: t("summary.optimal"),
      description: t("summary.optimalDescription"),
      icon: "checkmark-circle" as const,
      color: "emerald-500",
    },
  ];

  return (
    <ThemedView style={tw`flex-row gap-2.5`}>
      {tiles.map((tile) => {
        const isSelected = selectedStatus === tile.key;
        return (
          <Pressable
            key={tile.key}
            onPress={() => onSelectStatus(isSelected ? null : tile.key)}
            style={({ pressed }) => tw.style("flex-1", pressed && "opacity-70")}
            accessibilityRole="button"
            accessibilityLabel={tile.label}
          >
            <ThemedView
              style={[
                tw`bg-light-surface rounded-3xl p-3.5 gap-2`,
                isSelected && {
                  borderWidth: 2,
                  borderColor: tw.color(tile.color),
                },
              ]}
            >
              <ThemedView
                style={tw`flex-row items-center justify-between bg-transparent`}
              >
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {tile.label}
                </ThemedText>
                <Ionicons
                  name={tile.icon}
                  size={16}
                  color={tw.color(tile.color)}
                />
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
          </Pressable>
        );
      })}
    </ThemedView>
  );
}
