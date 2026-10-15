import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatTime } from "@/core/i18n/utils";
import Card from "@/presentation/theme/components/card";
import {
  getPurchaseCreatorName,
  type InventoryPurchase,
} from "@/core/inventory/models/inventory-purchase.model";

interface InventoryPurchaseCardProps {
  purchase: InventoryPurchase;
  onPress: (purchase: InventoryPurchase) => void;
  /** Highlights the purchase open in the detail pane (tablet). */
  active?: boolean;
}

/** One purchase in the purchases history: size, time, who registered it and its note. */
export default function InventoryPurchaseCard({
  purchase,
  onPress,
  active,
}: InventoryPurchaseCardProps) {
  const { t } = useTranslation("inventory");
  const creator = getPurchaseCreatorName(purchase);

  return (
    <Card
      variant="outline"
      onPress={() => onPress(purchase)}
      style={tw.style("gap-3 p-4", active && "bg-light-secondary")}
    >
      <ThemedView
        style={tw`flex-row items-start justify-between gap-3 bg-transparent`}
      >
        <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
          <ThemedText
            type="body1"
            style={[
              { fontFamily: typography.semibold },
              tw`text-light-on-surface`,
            ]}
          >
            {t("purchases.productsCount", { count: purchase.itemsCount ?? 0 })}
          </ThemedText>
          {creator && (
            <ThemedText
              type="small"
              style={tw`text-gray-500`}
              numberOfLines={1}
            >
              {t("purchases.registeredBy", { name: creator })}
            </ThemedText>
          )}
        </ThemedView>
        <ThemedText
          type="small"
          style={[
            tw`text-light-on-surface-variant pt-1`,
            { fontVariant: ["tabular-nums"] },
          ]}
        >
          {formatTime(purchase.createdAt)}
        </ThemedText>
      </ThemedView>

      {purchase.note && (
        <ThemedView style={tw`flex-row items-start gap-2 bg-transparent`}>
          <Ionicons
            name="document-text-outline"
            size={16}
            color={tw.color("gray-400")}
            style={tw`mt-0.5`}
          />
          <ThemedText
            type="body2"
            style={tw`flex-1 text-light-on-surface-variant`}
            numberOfLines={2}
          >
            {purchase.note}
          </ThemedText>
        </ThemedView>
      )}
    </Card>
  );
}
