import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Card from "@/presentation/theme/components/card";
import Label, { type LabelProps } from "@/presentation/theme/components/label";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import {
  InventoryCountItemStatus,
  isCountItemAnswered,
  type InventoryCountItem,
} from "@/core/inventory/models/inventory-count.model";

const STATUS_COLORS: Record<InventoryCountItemStatus, LabelProps["color"]> = {
  [InventoryCountItemStatus.PENDING]: "default",
  [InventoryCountItemStatus.MATCHED]: "success",
  [InventoryCountItemStatus.ADJUSTED]: "warning",
  [InventoryCountItemStatus.SKIPPED]: "default",
};

interface CountLineCardProps {
  line: InventoryCountItem;
  onPress?: () => void;
}

/** One counted product: its answer and, when answered, system vs counted amounts. */
export default function CountLineCard({ line, onPress }: CountLineCardProps) {
  const { t } = useTranslation("inventory");
  const unit = t(`units.${line.inventoryItem.unit}`);
  const difference = line.difference ?? 0;

  return (
    <Card onPress={onPress} style={tw`p-4`}>
      <ThemedView style={tw`gap-1 bg-transparent`}>
        <ThemedView
          style={tw`flex-row items-center justify-between gap-3 bg-transparent`}
        >
          <ThemedText type="body1" numberOfLines={1} style={tw`flex-1`}>
            {line.inventoryItem.name}
          </ThemedText>
          <Label
            text={t(`counts.status.${line.status}`)}
            color={STATUS_COLORS[line.status]}
            size="small"
          />
        </ThemedView>
        {isCountItemAnswered(line) ? (
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("counts.lineQuantities", {
              expected: line.expectedQuantity,
              counted: line.countedQuantity,
              unit,
            })}
            {difference !== 0 && (
              <ThemedText
                type="small"
                style={tw`${difference > 0 ? "text-green-600" : "text-red-600"}`}
              >
                {` (${difference > 0 ? "+" : ""}${difference})`}
              </ThemedText>
            )}
          </ThemedText>
        ) : (
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("counts.notCounted")}
          </ThemedText>
        )}
      </ThemedView>
    </Card>
  );
}
