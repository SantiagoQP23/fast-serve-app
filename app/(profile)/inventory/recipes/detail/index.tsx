import { ScrollView, RefreshControl } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { canManageInventory } from "@/core/auth/models/user.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import InventoryDetailTitle from "@/presentation/inventory/components/inventory-detail-title";
import InventorySectionHeader from "@/presentation/inventory/components/inventory-section-header";
import InventoryLineRow from "@/presentation/inventory/components/inventory-line-row";
import { useInventoryRecipes } from "@/presentation/inventory/hooks/useInventoryRecipes";

/** Read-only recipe of a variant; editing happens in the option-recipe screen. */
export default function InventoryRecipeDetailScreen() {
  const { t } = useTranslation("inventory");
  const params = useLocalSearchParams<{
    productOptionId: string;
    productOptionName?: string;
    productName?: string;
  }>();
  const productOptionId = Number(params.productOptionId);
  const { user } = useAuthStore();
  const canManage = canManageInventory(user?.role?.name);
  const { recipes, recipesQuery } = useInventoryRecipes(productOptionId);

  const lines = recipes.filter((line) => !!line.inventoryItem);

  const navigateToEdit = () =>
    router.push({
      pathname: "/(profile)/menu/products/option-recipe",
      params: {
        productOptionId: String(productOptionId),
        productOptionName: params.productOptionName,
        productName: params.productName,
      },
    });

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
      <InventoryScreenHeader
        right={
          canManage ? (
            <Button
              label={t("common:actions.edit")}
              leftIcon="square-pen"
              variant="surface"
              size="extra-small"
              onPress={navigateToEdit}
            />
          ) : undefined
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-6 pt-6 pb-8`}
        refreshControl={
          <RefreshControl
            refreshing={recipesQuery.isFetching}
            onRefresh={recipesQuery.refetch}
            tintColor={tw.color("primary")}
            colors={[tw.color("primary") as string]}
          />
        }
      >
        <InventoryDetailTitle
          icon="utensils"
          title={params.productName || t("recipe.title")}
          subtitle={params.productOptionName || undefined}
        />

        {recipesQuery.isLoading && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {t("loading")}
            </ThemedText>
          </ThemedView>
        )}

        {recipesQuery.isError && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="circle-alert" size={48} color={tw.color("red-500")} />
            <ThemedText type="body1" style={tw`text-red-500`}>
              {t("loadError")}
            </ThemedText>
            <Button
              label={t("retry")}
              onPress={() => recipesQuery.refetch()}
              variant="outline"
            />
          </ThemedView>
        )}

        {!recipesQuery.isLoading &&
          !recipesQuery.isError &&
          lines.length === 0 && (
            <ThemedView style={tw`items-center py-8 gap-3`}>
              <Icon name="utensils" size={48} color={tw.color("gray-400")} />
              <ThemedText
                type="body1"
                style={{ fontFamily: typography.semibold }}
              >
                {t("recipe.empty")}
              </ThemedText>
              <ThemedText
                type="body2"
                style={tw`text-center text-gray-500 px-4`}
              >
                {t("recipe.emptyDescription")}
              </ThemedText>
            </ThemedView>
          )}

        {lines.length > 0 && (
          <ThemedView style={tw`gap-2 bg-transparent`}>
            <InventorySectionHeader
              title={t("trackMode.ingredients.label")}
              count={lines.length}
            />
            <ThemedView style={tw`bg-transparent`}>
              {lines.map((line) => (
                <InventoryLineRow
                  key={line.id}
                  name={line.inventoryItem?.name}
                  quantity={t("quantityWithUnit", {
                    quantity: line.quantity,
                    unit: line.inventoryItem?.unit
                      ? t(`units.${line.inventoryItem.unit}`, {
                          count: line.quantity,
                        })
                      : "",
                  })}
                />
              ))}
            </ThemedView>
          </ThemedView>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}
