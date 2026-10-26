import { ScrollView as GestureScrollView } from "react-native-gesture-handler";
import tw from "@/presentation/theme/lib/tailwind";
import Chip from "@/presentation/theme/components/chip";
import Label, { type LabelProps } from "@/presentation/theme/components/label";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import type { InventoryStockSummaryCounts } from "@/presentation/inventory/services/inventory.service";
import { InventoryItemStockStatusFilter } from "@/presentation/inventory/interfaces/dto/find-all-inventory-items.dto";

interface InventoryStockSummaryProps {
  counts: InventoryStockSummaryCounts;
  selectedStatus: InventoryItemStockStatusFilter | null;
  onSelectStatus: (status: InventoryItemStockStatusFilter | null) => void;
}

/** Stock status filter chips with their counts, like the menu's stock chips. */
export default function InventoryStockSummary({
  counts,
  selectedStatus,
  onSelectStatus,
}: InventoryStockSummaryProps) {
  const { t } = useTranslation("inventory");

  const noMinimumCount = counts.noMinimum ?? 0;
  const filters: {
    key: InventoryItemStockStatusFilter;
    count: number;
    label: string;
    color: NonNullable<LabelProps["color"]>;
  }[] = [
    {
      key: InventoryItemStockStatusFilter.CRITICAL,
      count: counts.critical,
      label: t("status.critical"),
      color: "error",
    },
    {
      key: InventoryItemStockStatusFilter.LOW,
      count: counts.low,
      label: t("status.low"),
      color: "warning",
    },
    {
      key: InventoryItemStockStatusFilter.OPTIMAL,
      count: counts.optimal,
      label: t("status.optimal"),
      color: "success",
    },
    // Items with no minimum fit none of the health buckets; this keeps
    // them findable so a minimum can be set.
    ...(noMinimumCount > 0 ||
    selectedStatus === InventoryItemStockStatusFilter.NO_MINIMUM
      ? [
          {
            key: InventoryItemStockStatusFilter.NO_MINIMUM,
            count: noMinimumCount,
            label: t("status.noMinimum"),
            color: "default" as const,
          },
        ]
      : []),
  ];

  return (
    <GestureScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={tw`flex-grow-0`}
      contentContainerStyle={tw`gap-2`}
    >
      {filters.map((filter) => {
        const isSelected = selectedStatus === filter.key;
        return (
          <Chip
            key={filter.key}
            label={filter.label}
            selected={isSelected}
            onPress={() => onSelectStatus(isSelected ? null : filter.key)}
            rightContent={
              <Label
                text={String(filter.count)}
                size="small"
                color={filter.count === 0 ? "default" : filter.color}
              />
            }
          />
        );
      })}
    </GestureScrollView>
  );
}
