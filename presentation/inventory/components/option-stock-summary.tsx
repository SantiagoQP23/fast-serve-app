import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import Button from "@/presentation/theme/components/button";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

interface OptionStockSummaryProps {
  productOptionId: number;
  productOptionName: string;
  trackStock: boolean;
  quantity: number;
  canManage: boolean;
}

export default function OptionStockSummary({
  productOptionId,
  productOptionName,
  trackStock,
  quantity,
  canManage,
}: OptionStockSummaryProps) {
  const { t } = useTranslation("inventory");

  const handleManageRecipe = () => {
    router.push({
      pathname: "/(profile)/menu-product-option-recipe",
      params: {
        productOptionId: String(productOptionId),
        productOptionName,
      },
    });
  };

  return (
    <ThemedView style={tw`flex-row items-center justify-between mt-1`}>
      {trackStock ? (
        <ThemedView style={tw`flex-row items-center gap-1`}>
          <Ionicons
            name="cube-outline"
            size={14}
            color={tw.color("text-light-on-surface-variant")}
          />
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("stockCount", { count: quantity })}
          </ThemedText>
        </ThemedView>
      ) : (
        <ThemedText type="small" style={tw`text-gray-500`}>
          {t("notTracked")}
        </ThemedText>
      )}
      {canManage && (
        <Button
          label={t("recipe.manageRecipe")}
          size="small"
          variant="text"
          onPress={handleManageRecipe}
        />
      )}
    </ThemedView>
  );
}
