import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatTime } from "@/core/i18n/utils";
import Card from "@/presentation/theme/components/card";
import Label from "@/presentation/theme/components/label";
import ProgressBar from "@/presentation/theme/components/progress-bar";
import {
  InventoryCountItemStatus,
  InventoryCountStatus,
  getCountUserName,
  type InventoryCount,
  type InventoryCountPreviewItem,
} from "@/core/inventory/models/inventory-count.model";
import InventoryCardLines, {
  type InventoryCardLine,
} from "./inventory-card-lines";
import { getCountStatusIcon } from "./count-status-icon";

/** Answered lines show what was counted; adjusted ones also the correction. */
function toCardLine(line: InventoryCountPreviewItem): InventoryCardLine {
  const difference = line.difference ?? 0;
  const answered =
    line.status === InventoryCountItemStatus.MATCHED ||
    line.status === InventoryCountItemStatus.ADJUSTED;

  return {
    id: line.id,
    name: line.inventoryItem.name,
    unit: line.inventoryItem.unit,
    quantity: answered ? line.countedQuantity : null,
    ...getCountStatusIcon(line.status),
    trailing:
      line.status === InventoryCountItemStatus.ADJUSTED && difference !== 0
        ? {
            text: `${difference > 0 ? "+" : ""}${difference}`,
            colorClass: difference > 0 ? "text-emerald-700" : "text-red-700",
          }
        : undefined,
  };
}

interface InventoryCountCardProps {
  count: InventoryCount;
  onPress: (count: InventoryCount) => void;
  /** Highlights the count open in the detail pane (tablet). */
  active?: boolean;
}

/** One count in the counts history: size, status, who started it, how far along it is and its first items. */
export default function InventoryCountCard({
  count,
  onPress,
  active,
}: InventoryCountCardProps) {
  const { t } = useTranslation("inventory");
  const creator = getCountUserName(count.createdBy);
  const inProgress = count.status === InventoryCountStatus.IN_PROGRESS;
  const total = count.itemsCount ?? 0;
  const answered = Math.max(total - (count.pendingCount ?? 0), 0);

  return (
    <Card
      variant="outline"
      onPress={() => onPress(count)}
      style={tw.style("gap-3 p-4", active && "bg-secondary")}
    >
      <ThemedView
        style={tw`flex-row items-start justify-between gap-3 bg-transparent`}
      >
        <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
          <ThemedText
            type="body1"
            style={[
              { fontFamily: typography.semibold },
              tw`text-on-surface`,
            ]}
          >
            {t("counts.productsCount", { count: total })}
          </ThemedText>
          <ThemedText type="small" style={tw`text-gray-500`} numberOfLines={1}>
            <ThemedText type="small" style={{ fontVariant: ["tabular-nums"] }}>
              {formatTime(count.createdAt)}
            </ThemedText>
            {creator ? ` · ${t("counts.startedBy", { name: creator })}` : ""}
          </ThemedText>
        </ThemedView>
        <Label
          text={t(`counts.countStatus.${count.status}`)}
          color={inProgress ? "info" : "success"}
          variant="solid"
          size="small"
        />
      </ThemedView>

      {inProgress && total > 0 && (
        <ThemedView style={tw`flex-row items-center gap-3 bg-transparent`}>
          <ThemedView style={tw`flex-1 bg-transparent`}>
            <ProgressBar progress={answered / total} height={1.5} />
          </ThemedView>
          <ThemedText
            type="small"
            style={[
              tw`text-on-surface-variant`,
              { fontVariant: ["tabular-nums"] },
            ]}
          >
            {answered}/{total}
          </ThemedText>
        </ThemedView>
      )}

      <InventoryCardLines
        total={total}
        lines={(count.previewItems ?? []).map(toCardLine)}
      />

      <ThemedText type="small" style={tw`text-gray-500`}>
        {t("counts.progressLine", {
          adjusted: count.adjustedCount ?? 0,
          unanswered: count.pendingCount ?? 0,
        })}
      </ThemedText>
    </Card>
  );
}
