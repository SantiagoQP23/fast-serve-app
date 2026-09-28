import { type StyleProp, type ViewStyle } from "react-native";
import dayjs from "dayjs";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import {
  getInventoryStockStatus,
  type InventoryItem,
} from "@/core/inventory/models/inventory-item.model";
import { INVENTORY_STATUS_STYLES } from "./inventory-item-card";

interface InventoryDetailSummaryCardProps {
  item: InventoryItem;
}

export default function InventoryDetailSummaryCard({
  item,
}: InventoryDetailSummaryCardProps) {
  const { t } = useTranslation("inventory");
  const status = getInventoryStockStatus(item);
  const styles = INVENTORY_STATUS_STYLES[status];
  const unitLabel = t(`units.${item.unit}`);

  return (
    <ThemedView style={tw`bg-light-surface rounded-3xl p-6 gap-5 shadow-xs`}>
      <ThemedText type="h3" style={{ fontFamily: typography.bold }}>
        {item.name}
      </ThemedText>

      <ThemedView
        style={tw`bg-light-background rounded-3xl p-5 shadow-xs flex-row items-baseline justify-between`}
      >
        <ThemedView style={tw`gap-1 bg-transparent`}>
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("detail.currentStock")}
          </ThemedText>
          <ThemedView
            style={tw`flex-row items-baseline gap-1.5 bg-transparent`}
          >
            <ThemedText
              type="h1"
              style={[
                { fontFamily: typography.bold },
                tw`text-light-primary`,
              ]}
            >
              {item.quantity}
            </ThemedText>
            <ThemedText
              type="body1"
              style={[
                { fontFamily: typography.semibold },
                tw`text-light-primary`,
              ]}
            >
              {unitLabel}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView
          style={tw.style(
            "flex-row items-center gap-1.5 px-3 py-1.5 rounded-full",
            styles.badgeBg,
          )}
        >
          <ThemedView
            style={tw.style("w-2 h-2 rounded-full", `bg-${styles.color}`)}
          />
          <ThemedText
            type="small"
            style={[
              tw.style(styles.badgeText),
              { fontFamily: typography.semibold },
            ]}
          >
            {t(`status.${status}`)}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView
        style={tw`flex-row flex-wrap gap-y-4 pt-4 border-t border-light-divider bg-transparent`}
      >
        {item.minimumQuantity != null && (
          <DetailField
            style={tw`w-1/2`}
            label={t("detail.minimumStock")}
            value={`${item.minimumQuantity} ${unitLabel}`}
          />
        )}
        <DetailField
          style={tw`w-1/2`}
          label={t("detail.unit")}
          value={unitLabel}
        />
        <DetailField
          style={tw`w-1/2`}
          label={t("detail.status")}
          value={item.isActive ? t("active") : t("status.inactive")}
        />
        {item.updatedAt && (
          <DetailField
            style={tw`w-1/2`}
            label={t("detail.lastUpdated")}
            value={dayjs(item.updatedAt).format("MMM D, HH:mm")}
          />
        )}
      </ThemedView>
    </ThemedView>
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
