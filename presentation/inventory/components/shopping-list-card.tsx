import { router } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Card from "@/presentation/theme/components/card";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useShoppingList } from "@/presentation/inventory/hooks/useShoppingList";

/** Entry to the shopping list at the top of the Compras tab. */
export default function ShoppingListCard() {
  const { t } = useTranslation("inventory");
  const { lowItems, itemsQuery } = useShoppingList();
  const count = lowItems.length;

  return (
    <Card
      variant="outline"
      style={tw`p-4`}
      onPress={() =>
        router.push({ pathname: "/(profile)/inventory/purchases/shopping-list" })
      }
      accessibilityRole="button"
    >
      <ThemedView style={tw`flex-row items-center gap-3 bg-transparent`}>
        <ThemedView
          style={tw`w-11 h-11 rounded-full items-center justify-center ${
            count > 0 ? "bg-orange-100" : "bg-emerald-100"
          }`}
        >
          <Icon
            name="clipboard-list"
            size={22}
            color={tw.color(count > 0 ? "orange-600" : "emerald-600")}
          />
        </ThemedView>
        <ThemedView style={tw`flex-1 gap-0.5 bg-transparent`}>
          <ThemedText
            type="body1"
            style={[{ fontFamily: typography.semibold }, tw`text-on-surface`]}
          >
            {t("shoppingList.title")}
          </ThemedText>
          <ThemedText type="small" style={tw`text-gray-500`}>
            {itemsQuery.isLoading
              ? t("loading")
              : count > 0
                ? t("shoppingList.lowCount", { count })
                : t("shoppingList.allGood")}
          </ThemedText>
        </ThemedView>
        <Icon name="chevron-right" size={20} color={tw.color("gray-400")} />
      </ThemedView>
    </Card>
  );
}
