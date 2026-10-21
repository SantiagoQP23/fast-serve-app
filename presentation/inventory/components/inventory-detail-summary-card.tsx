import { type StyleProp, type ViewStyle } from "react-native";
import dayjs from "dayjs";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Label, { type LabelProps } from "@/presentation/theme/components/label";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import {
  getInventoryStockStatus,
  type InventoryItem,
  type InventoryStockStatus,
} from "@/core/inventory/models/inventory-item.model";
import InventoryDetailTitle from "./inventory-detail-title";

interface InventoryDetailSummaryCardProps {
  item: InventoryItem;
}

const STATUS_LABEL_COLOR: Record<InventoryStockStatus, LabelProps["color"]> = {
  critical: "error",
  low: "warning",
  optimal: "success",
  noMinimum: "default",
  inactive: "default",
};

/**
 * Top of the item detail, laid out like the count and purchase details:
 * the item's name as the title, its stock as the lead figure, then the
 * facts that qualify that figure.
 */
export default function InventoryDetailSummaryCard({
  item,
}: InventoryDetailSummaryCardProps) {
  const { t } = useTranslation("inventory");
  const status = getInventoryStockStatus(item);

  return (
    <InventoryDetailTitle
      icon="package"
      title={item.name}
      subtitle={item.category?.name ?? t("categories.uncategorized")}
      labels={
        <Label
          text={t(`status.${status}`)}
          color={STATUS_LABEL_COLOR[status]}
          size="small"
        />
      }
    >
      <ThemedView style={tw`gap-1 bg-transparent`}>
        <ThemedText type="small" style={tw`text-gray-500`}>
          {t("detail.currentStock")}
        </ThemedText>
        <ThemedView style={tw`flex-row items-baseline gap-1.5 bg-transparent`}>
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
            {t(`units.${item.unit}`, { count: item.quantity })}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView
        style={tw`flex-row flex-wrap gap-y-4 pt-4 border-t border-divider bg-transparent`}
      >
        <DetailField
          style={tw`w-1/2`}
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
        <DetailField
          style={tw`w-1/2`}
          label={t("detail.unit")}
          value={t(`units.${item.unit}`)}
        />
        {item.updatedAt && (
          <DetailField
            style={tw`w-1/2`}
            label={t("detail.lastUpdated")}
            value={dayjs(item.updatedAt).format("MMM D, HH:mm")}
          />
        )}
      </ThemedView>
    </InventoryDetailTitle>
  );
}

interface DetailFieldProps {
  label: string;
  value: string;
  style?: StyleProp<ViewStyle>;
}

function DetailField({ label, value, style }: DetailFieldProps) {
  return (
    <ThemedView style={[tw`bg-transparent gap-0.5`, style]}>
      <ThemedText type="small" style={tw`text-gray-500`}>
        {label}
      </ThemedText>
      <ThemedText type="body2" style={{ fontFamily: typography.medium }}>
        {value}
      </ThemedText>
    </ThemedView>
  );
}
