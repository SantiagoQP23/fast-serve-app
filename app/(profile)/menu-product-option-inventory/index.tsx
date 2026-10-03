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
import WholeProductInventoryModal from "@/presentation/inventory/components/whole-product-inventory-modal";
import { InventoryUnit } from "@/core/inventory/models/inventory-item.model";

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

  const [showWholeProductModal, setShowWholeProductModal] = useState(false);

  const wholeProductLine =
    recipes.length === 1 &&
    recipes[0].quantity === 1 &&
    recipes[0].inventoryItem?.unit === InventoryUnit.UNIT
      ? recipes[0]
      : null;
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
      pathname: "/(profile)/menu-product-option-recipe",
      params: {
        productOptionId: String(productOptionId),
        productOptionName: params.productOptionName,
        productName: params.productName,
      },
    });
  };

  const closeWholeProductModal = () => setShowWholeProductModal(false);

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
      <ThemedView style={tw`items-center gap-4 flex-row mb-6`}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => tw.style(pressed && "opacity-70")}
        >
          <Ionicons name="arrow-back-outline" size={24} />
        </Pressable>
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
              onPress={canManage ? () => setShowWholeProductModal(true) : undefined}
              style={tw`gap-1`}
            >
              <ThemedText type="body1" style={{ fontFamily: typography.medium }}>
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
              <ThemedText type="body1" style={{ fontFamily: typography.medium }}>
                {t("trackMode.ingredients.label")}
              </ThemedText>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("trackMode.ingredients.description")}
              </ThemedText>
            </Card>
          </ThemedView>
        )}

        {wholeProductLine && (
          <Card
            onPress={canManage ? () => setShowWholeProductModal(true) : undefined}
            style={tw`flex-row items-center justify-between`}
          >
            <ThemedView style={tw`flex-1 gap-1`}>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("trackMode.wholeProduct.label")}
              </ThemedText>
              <ThemedText type="body1" style={{ fontFamily: typography.medium }}>
                {wholeProductLine.inventoryItem?.name}
              </ThemedText>
              <ThemedText type="body2" style={tw`text-gray-500`}>
                {t("quantityWithUnit", {
                  quantity: wholeProductLine.inventoryItem?.quantity ?? 0,
                  unit: t(`units.${wholeProductLine.inventoryItem?.unit}`),
                })}
              </ThemedText>
            </ThemedView>
            {canManage && (
              <Ionicons
                name="chevron-forward"
                size={18}
                color={tw.color("gray-400")}
              />
            )}
          </Card>
        )}

        {isIngredientsMode && (
          <ThemedView>
            {recipes.map((line, index) => {
              const isLast = index === recipes.length - 1;
              return (
                <ThemedView
                  key={line.id}
                  style={[
                    tw`flex-row items-center justify-between py-4`,
                    !isLast && tw`border-b border-light-divider`,
                  ]}
                >
                  <ThemedText type="body1">
                    {line.inventoryItem?.name}
                  </ThemedText>
                  <ThemedText type="body2" style={tw`text-gray-500`}>
                    {t("quantityWithUnit", {
                      quantity: line.quantity,
                      unit: line.inventoryItem
                        ? t(`units.${line.inventoryItem.unit}`)
                        : "",
                    })}
                  </ThemedText>
                </ThemedView>
              );
            })}
          </ThemedView>
        )}

        {isIngredientsMode && canManage && (
          <Button
            label={t("recipe.manageRecipe")}
            leftIcon="list-outline"
            variant="outline"
            onPress={navigateToRecipeScreen}
          />
        )}
      </ScrollView>

      <WholeProductInventoryModal
        visible={showWholeProductModal}
        productOptionId={productOptionId}
        productName={params.productName}
        productOptionName={params.productOptionName}
        line={wholeProductLine}
        onClose={closeWholeProductModal}
      />
    </ScreenLayout>
  );
}
