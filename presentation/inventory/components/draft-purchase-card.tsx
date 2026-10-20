import { router } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import Card from "@/presentation/theme/components/card";
import Label from "@/presentation/theme/components/label";
import InventoryCardLines from "./inventory-card-lines";
import { usePurchaseCartStore } from "@/presentation/inventory/store/purchaseCartStore";

// Same number of lines the backend previews on a registered purchase.
const PREVIEW_LINES = 3;

/** The purchase still being built, shown like a history card so it can be picked back up. */
export default function DraftPurchaseCard() {
  const { t } = useTranslation("inventory");
  const lines = usePurchaseCartStore((state) => state.lines);
  const note = usePurchaseCartStore((state) => state.note);

  if (lines.length === 0) return null;

  return (
    <Card
      variant="outline"
      onPress={() =>
        router.push({ pathname: "/(profile)/inventory/purchases/items" })
      }
      accessibilityRole="button"
      style={tw`gap-3 p-4`}
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
            {t("purchases.productsCount", { count: lines.length })}
          </ThemedText>
          <ThemedText type="small" style={tw`text-gray-500`} numberOfLines={1}>
            {t("purchases.draftHint")}
          </ThemedText>
        </ThemedView>
        <Label
          text={t("purchases.inProgress")}
          color="info"
          variant="solid"
          size="small"
        />
      </ThemedView>

      <InventoryCardLines
        total={lines.length}
        lines={lines.slice(0, PREVIEW_LINES).map((line) => ({
          id: line.item.id,
          name: line.item.name,
          unit: line.item.unit,
          quantity: line.quantity,
          prefix: "+",
        }))}
      />

      {!!note && (
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
            {note}
          </ThemedText>
        </ThemedView>
      )}
    </Card>
  );
}
