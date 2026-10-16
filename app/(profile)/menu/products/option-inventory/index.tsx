import { useState } from "react";
import { ScrollView, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import { useInventoryRecipes } from "@/presentation/inventory/hooks/useInventoryRecipes";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import InventoryLineRow from "@/presentation/inventory/components/inventory-line-row";
import WholeProductInventoryModal from "@/presentation/inventory/components/whole-product-inventory-modal";
import type { InventoryUnit } from "@/core/inventory/models/inventory-item.model";
import { getWholeProductLine } from "@/core/inventory/models/inventory-recipe.model";

export default function MenuProductOptionInventoryScreen() {
  const { t } = useTranslation("inventory");
  const params = useLocalSearchParams<{
    productOptionId: string;
    productOptionName?: string;
    productName?: string;
  }>();
  const productOptionId = Number(params.productOptionId);
  const { user } = useAuthStore();
  const canManage = isAdminLevelRole(user?.role?.name);
  const { recipes, recipesQuery } = useInventoryRecipes(productOptionId);
  const products = useMenuStore((state) => state.products);

  // Single-variant products name the inventory item after the product alone.
  const product = products.find((p) =>
    p.options.some((option) => option.id === productOptionId),
  );
  const hasSingleVariant = !!product && product.options.length === 1;

  const [showWholeProductModal, setShowWholeProductModal] = useState(false);

  const wholeProductLine = getWholeProductLine(recipes);
  const isIngredientsMode = recipes.length > 0 && !wholeProductLine;

  const headerTitle = wholeProductLine
    ? t("trackMode.wholeProduct.label")
    : isIngredientsMode
      ? t("trackMode.ingredients.label")
      : t("trackMode.title");
  const headerSubtitle = wholeProductLine
    ? t("trackMode.wholeProduct.description")
    : isIngredientsMode
      ? t("trackMode.ingredients.description")
      : t("trackMode.question");

  const navigateToRecipeScreen = () => {
    router.push({
      pathname: "/(profile)/menu/products/option-recipe",
      params: {
        productOptionId: String(productOptionId),
        productOptionName: params.productOptionName,
        productName: params.productName,
      },
    });
  };

  const wholeProductItemId = wholeProductLine?.inventoryItem?.id;

  const navigateToInventoryItem = () => {
    if (!wholeProductItemId) return;
    router.push({
      pathname: "/(profile)/inventory/items/detail",
      params: { itemId: wholeProductItemId },
    });
  };

  const closeWholeProductModal = () => setShowWholeProductModal(false);

  const formatLineQuantity = (quantity: number, unit?: InventoryUnit): string =>
    t("quantityWithUnit", {
      quantity,
      unit: unit ? t(`units.${unit}`) : "",
    });

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
      <ThemedView style={tw`items-center justify-between flex-row mb-6`}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => tw.style(pressed && "opacity-70")}
        >
          <Ionicons name="arrow-back-outline" color={tw.color("on-surface")} size={24} />
        </Pressable>
        {canManage && wholeProductItemId && (
          <Button
            label={t("trackMode.manage")}
            leftIcon="settings-outline"
            variant="surface"
            size="extra-small"
            onPress={navigateToInventoryItem}
          />
        )}
        {canManage && isIngredientsMode && (
          <Button
            label={t("common:actions.edit")}
            leftIcon="create-outline"
            variant="surface"
            size="extra-small"
            onPress={navigateToRecipeScreen}
          />
        )}
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-4 pb-8`}
      >
        <ThemedView style={tw`gap-1`}>
          <ThemedText type="h2">{headerTitle}</ThemedText>
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {headerSubtitle}
          </ThemedText>
        </ThemedView>

        {recipesQuery.isLoading && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {t("loading")}
            </ThemedText>
          </ThemedView>
        )}

        {!recipesQuery.isLoading && recipes.length === 0 && (
          <ThemedView style={tw`gap-4 mt-2`}>
            <Card
              onPress={
                canManage ? () => setShowWholeProductModal(true) : undefined
              }
              style={tw`gap-1`}
            >
              <ThemedText
                type="body1"
                style={{ fontFamily: typography.medium }}
              >
                {t("trackMode.wholeProduct.label")}
              </ThemedText>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("trackMode.wholeProduct.description")}
              </ThemedText>
            </Card>

            <Card
              onPress={canManage ? navigateToRecipeScreen : undefined}
              style={tw`gap-1`}
            >
              <ThemedText
                type="body1"
                style={{ fontFamily: typography.medium }}
              >
                {t("trackMode.ingredients.label")}
              </ThemedText>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("trackMode.ingredients.description")}
              </ThemedText>
            </Card>
          </ThemedView>
        )}

        {wholeProductLine && (
          <ThemedView>
            <InventoryLineRow
              name={wholeProductLine.inventoryItem?.name}
              quantity={formatLineQuantity(
                wholeProductLine.inventoryItem?.quantity ?? 0,
                wholeProductLine.inventoryItem?.unit,
              )}
            />
            {canManage && (
              <Pressable
                onPress={navigateToRecipeScreen}
                style={({ pressed }) =>
                  tw.style("py-3", pressed && "opacity-60")
                }
              >
                <ThemedText type="body1" style={tw`text-gray-400`}>
                  {t("trackMode.switchToIngredients")}
                </ThemedText>
              </Pressable>
            )}
          </ThemedView>
        )}

        {isIngredientsMode && (
          <ThemedView>
            {recipes.map((line) => (
              <InventoryLineRow
                key={line.id}
                name={line.inventoryItem?.name}
                quantity={formatLineQuantity(
                  line.quantity,
                  line.inventoryItem?.unit,
                )}
              />
            ))}
          </ThemedView>
        )}
      </ScrollView>

      <WholeProductInventoryModal
        visible={showWholeProductModal}
        productOptionId={productOptionId}
        productName={params.productName}
        productOptionName={
          hasSingleVariant ? undefined : params.productOptionName
        }
        onClose={closeWholeProductModal}
      />
    </ScreenLayout>
  );
}
