import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import Button from "@/presentation/theme/components/button";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";

interface OptionStockSummaryProps {
  productOptionId: number;
  productOptionName: string;
  canManage: boolean;
}

export default function OptionStockSummary({
  productOptionId,
  productOptionName,
  canManage,
}: OptionStockSummaryProps) {
  const { t } = useTranslation("inventory");
  const { items, itemsQuery } = useInventoryItems(productOptionId);

  const trackedItems = items.filter((item) => item.trackStock);
  const totalStock = trackedItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleManageStock = () => {
    router.push({
      pathname: "/(profile)/menu-product-option-inventory",
      params: {
        productOptionId: String(productOptionId),
        productOptionName,
      },
    });
  };

  return (
    <ThemedView style={tw`flex-row items-center justify-between mt-1`}>
      {itemsQuery.isLoading ? (
        <ThemedText type="small" style={tw`text-gray-500`}>
          {t("loading")}
        </ThemedText>
      ) : trackedItems.length > 0 ? (
        <ThemedView style={tw`flex-row items-center gap-1`}>
          <Ionicons
            name="cube-outline"
            size={14}
            color={tw.color("text-light-on-surface-variant")}
          />
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("stockCount", { count: totalStock })}
          </ThemedText>
        </ThemedView>
      ) : (
        <ThemedText type="small" style={tw`text-gray-500`}>
          {t("notTracked")}
        </ThemedText>
      )}
      {canManage && (
        <Button
          label={t("manageStock")}
          size="small"
          variant="text"
          onPress={handleManageStock}
        />
      )}
    </ThemedView>
  );
}
