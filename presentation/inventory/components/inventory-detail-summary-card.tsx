import { Pressable, type StyleProp, type ViewStyle } from "react-native";
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
import InventoryDetailTitle, {
  formatDetailMoment,
} from "./inventory-detail-title";

interface InventoryDetailSummaryCardProps {
  item: InventoryItem;
  /** Shown as a "Set" action while the item has no minimum. */
  onSetMinimum?: () => void;
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
  onSetMinimum,
}: InventoryDetailSummaryCardProps) {
  const { t } = useTranslation("inventory");
  // An inactive item still has stock worth reading, so show its level
  // next to the Inactive label instead of hiding it.
  const stockStatus = getInventoryStockStatus({ ...item, isActive: true });
  const unitLabel = t(`units.${item.unit}`, { count: item.quantity });

  return (
    <InventoryDetailTitle
      icon="package"
      title={item.name}
      subtitle={item.category?.name ?? t("categories.uncategorized")}
      labels={
        <>
          {!item.isActive && (
            <Label
              text={t("status.inactive")}
              color={STATUS_LABEL_COLOR.inactive}
              size="small"
            />
          )}
          <Label
            text={t(`status.${stockStatus}`)}
            color={STATUS_LABEL_COLOR[stockStatus]}
            size="small"
          />
        </>
      }
    >
      <ThemedView
        style={tw`gap-1 bg-transparent`}
        accessible
        accessibilityLabel={`${t("detail.currentStock")}: ${item.quantity} ${unitLabel}`}
      >
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
            {unitLabel}
          </ThemedText>
        </ThemedView>
        {item.quantity < 0 && (
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("detail.negativeStockHint")}
          </ThemedText>
        )}
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
          action={
            !item.minimumQuantity && onSetMinimum
              ? { label: t("detail.setMinimum"), onPress: onSetMinimum }
              : undefined
          }
        />
        {item.updatedAt && (
          <DetailField
            style={tw`w-1/2`}
            label={t("detail.lastUpdated")}
            value={formatDetailMoment(item.updatedAt)}
          />
        )}
      </ThemedView>
    </InventoryDetailTitle>
  );
}

interface DetailFieldProps {
  label: string;
  value: string;
  /** An inline fix for a missing value, e.g. "Set" next to "Not set". */
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
}

function DetailField({ label, value, action, style }: DetailFieldProps) {
  return (
    <ThemedView style={[tw`bg-transparent gap-0.5`, style]}>
      <ThemedText type="small" style={tw`text-gray-500`}>
        {label}
      </ThemedText>
      <ThemedView style={tw`flex-row items-baseline gap-2 bg-transparent`}>
        <ThemedText type="body2" style={{ fontFamily: typography.medium }}>
          {value}
        </ThemedText>
        {action && (
          <Pressable
            onPress={action.onPress}
            accessibilityRole="button"
            hitSlop={12}
            style={({ pressed }) => tw.style(pressed && "opacity-70")}
          >
            <ThemedText
              type="body2"
              style={[
                tw`text-primary underline`,
                { fontFamily: typography.semibold },
              ]}
            >
              {action.label}
            </ThemedText>
          </Pressable>
        )}
      </ThemedView>
    </ThemedView>
  );
}
