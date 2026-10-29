import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import Label, { type LabelProps } from "@/presentation/theme/components/label";
import {
  DetailCard,
  DetailCardRow,
  DetailSectionTitle,
} from "@/presentation/theme/components/detail-card";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import {
  getInventoryStockStatus,
  type InventoryItem,
  type InventoryStockStatus,
} from "@/core/inventory/models/inventory-item.model";
import { formatDetailMoment } from "./inventory-detail-title";

export const STATUS_LABEL_COLOR: Record<
  InventoryStockStatus,
  LabelProps["color"]
> = {
  critical: "error",
  low: "warning",
  optimal: "success",
  noMinimum: "default",
  inactive: "default",
};

/** The stock figure, then the minimum and when it last changed. */
export function InventoryStockCard({
  item,
  onSetMinimum,
  footnote,
}: {
  item: InventoryItem;
  /** A "Set" action while the item has no minimum. */
  onSetMinimum?: () => void;
  /** A quiet line at the bottom, e.g. who shares the stock. */
  footnote?: string;
}) {
  const { t } = useTranslation("inventory");
  const unitLabel = t(`units.${item.unit}`, { count: item.quantity });
  // An inactive item still has stock worth reading, so show its level
  const stockStatus = getInventoryStockStatus({ ...item, isActive: true });
  const statusLabel = t(`status.${stockStatus}`);

  return (
    <ThemedView style={tw`gap-3 mt-4`}>
      <DetailSectionTitle title={t("detail.currentStock")} />
      <DetailCard style={tw`py-2`}>
        <ThemedView
          style={tw`gap-1 py-3 border-b border-divider`}
          accessible
          accessibilityLabel={`${t("detail.currentStock")}: ${item.quantity} ${unitLabel}, ${statusLabel}`}
        >
          <ThemedView style={tw`flex-row items-center gap-3`}>
            <ThemedView style={tw`flex-1 flex-row items-baseline gap-1.5`}>
              <ThemedText
                type="h1"
                style={[
                  { fontFamily: typography.semibold },
                  { fontVariant: ["tabular-nums"] },
                ]}
              >
                {item.quantity}
              </ThemedText>
              <ThemedText type="body1" style={tw`text-on-surface-variant`}>
                {unitLabel}
              </ThemedText>
            </ThemedView>
            <Label
              text={statusLabel}
              color={STATUS_LABEL_COLOR[stockStatus]}
              size="small"
            />
          </ThemedView>
          {item.quantity < 0 && (
            <ThemedText type="small" style={tw`text-gray-500`}>
              {t("detail.negativeStockHint")}
            </ThemedText>
          )}
        </ThemedView>

        {!item.minimumQuantity && onSetMinimum ? (
          // Without a minimum, whoever can set one gets just the button
          // (no value, so the row doesn't hide it from screen readers)
          <DetailCardRow label={t("detail.minimumStock")}>
            <Button
              label={t("detail.setMinimum")}
              variant="text"
              size="extra-small"
              style={tw`-mr-3`}
              onPress={onSetMinimum}
            />
          </DetailCardRow>
        ) : (
          <DetailCardRow
            label={t("detail.minimumStock")}
            value={
              item.minimumQuantity
                ? t("quantityWithUnit", {
                    quantity: item.minimumQuantity,
                    unit: t(`units.${item.unit}`, {
                      count: item.minimumQuantity,
                    }),
                  })
                : t("detail.minimumNotSet")
            }
          />
        )}
        {item.updatedAt && (
          <ThemedView style={tw`border-t border-divider`}>
            <DetailCardRow
              label={t("detail.lastUpdated")}
              value={formatDetailMoment(item.updatedAt)}
            />
          </ThemedView>
        )}
        {!!footnote && (
          <ThemedText
            type="small"
            style={tw`text-gray-500 py-3 border-t border-divider`}
          >
            {footnote}
          </ThemedText>
        )}
      </DetailCard>
    </ThemedView>
  );
}
