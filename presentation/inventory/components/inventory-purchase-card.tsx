import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatTime } from "@/core/i18n/utils";
import Card from "@/presentation/theme/components/card";
import InventoryCardLines from "./inventory-card-lines";
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

/** One purchase in the purchases history: its first items, its note, then time, size and who registered it. */
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
      style={tw.style("gap-3 p-4", active && "bg-secondary")}
    >
      <InventoryCardLines
        total={purchase.itemsCount ?? 0}
        lines={(purchase.previewItems ?? []).map((line) => ({
          id: line.id,
          name: line.inventoryItem.name,
          unit: line.inventoryItem.unit,
          quantity: line.quantity,
          prefix: "+",
        }))}
      />

      {purchase.note && (
        <ThemedView style={tw`flex-row items-start gap-2 bg-transparent`}>
          <Icon
            name="file-text"
            size={16}
            color={tw.color("gray-400")}
            style={tw`mt-0.5`}
          />
          <ThemedText
            type="body2"
            style={tw`flex-1 text-on-surface-variant`}
            numberOfLines={2}
          >
            {purchase.note}
          </ThemedText>
        </ThemedView>
      )}

      <ThemedText type="small" style={tw`text-gray-500`} numberOfLines={1}>
        <ThemedText type="small" style={{ fontVariant: ["tabular-nums"] }}>
          {formatTime(purchase.createdAt)}
        </ThemedText>
        {` · ${t("purchases.productsCount", { count: purchase.itemsCount ?? 0 })}`}
        {creator ? ` · ${creator}` : ""}
      </ThemedText>
    </Card>
  );
}
