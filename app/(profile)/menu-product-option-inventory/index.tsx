import { useState } from "react";
import { ScrollView, RefreshControl, Pressable } from "react-native";
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
import Fab from "@/presentation/theme/components/fab";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import SwipeableRow from "@/presentation/theme/components/swipeable-row";
import { useInventoryRecipes } from "@/presentation/inventory/hooks/useInventoryRecipes";
import RecipeLineModal from "@/presentation/inventory/components/recipe-line-modal";
import type { ProductOptionInventoryItem } from "@/core/inventory/models/inventory-recipe.model";

export default function MenuProductOptionInventoryScreen() {
  const { t } = useTranslation("inventory");
  const params = useLocalSearchParams<{
    productOptionId: string;
    productOptionName?: string;
  }>();
  const productOptionId = Number(params.productOptionId);
  const { user } = useAuthStore();
  const canManage = isAdminLevelRole(user?.role?.name);
  const { recipes, recipesQuery, deleteRecipe } =
    useInventoryRecipes(productOptionId);
  const [lineToDelete, setLineToDelete] =
    useState<ProductOptionInventoryItem | null>(null);
  const [lineToEdit, setLineToEdit] =
    useState<ProductOptionInventoryItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleConfirmDelete = async () => {
    if (!lineToDelete) return;
    await deleteRecipe.mutateAsync(lineToDelete.id);
    setLineToDelete(null);
  };

  const closeLineModal = () => {
    setShowAddModal(false);
    setLineToEdit(null);
  };

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
      <ThemedView style={tw`items-center gap-4 flex-row mb-6`}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => tw.style(pressed && "opacity-70")}
        >
          <Ionicons name="arrow-back-outline" size={24} />
        </Pressable>
        <ThemedText
          type="h3"
          style={{ fontFamily: typography.regular }}
          numberOfLines={1}
        >
          {params.productOptionName ?? t("recipe.title")}
        </ThemedText>
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-4 pb-8`}
        refreshControl={
          <RefreshControl
            refreshing={recipesQuery.isFetching}
            onRefresh={recipesQuery.refetch}
            tintColor={tw.color("blue-500")}
            colors={[tw.color("blue-500") || "#3b82f6"]}
          />
        }
      >
        {recipesQuery.isLoading && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {t("loading")}
            </ThemedText>
          </ThemedView>
        )}

        {recipesQuery.isError && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
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
          recipes.length === 0 && (
            <ThemedView style={tw`items-center py-8 gap-3`}>
              <Ionicons name="restaurant-outline" size={48} color="#999" />
              <ThemedText type="body1" style={tw`font-semibold`}>
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

        {recipes.length > 0 && (
          <ThemedView style={tw`gap-3`}>
            {recipes.map((line) => (
              <SwipeableRow
                key={line.id}
                onEdit={canManage ? () => setLineToEdit(line) : undefined}
                onDelete={
                  canManage ? () => setLineToDelete(line) : undefined
                }
              >
                <Card>
                  <ThemedView
                    style={tw`flex-row items-center justify-between`}
                  >
                    <ThemedView style={tw`gap-1 flex-1`}>
                      <ThemedText type="body1">
                        {line.inventoryItem?.name}
                      </ThemedText>
                      <ThemedText type="small" style={tw`text-gray-500`}>
                        {t("quantityWithUnit", {
                          quantity: line.quantity,
                          unit: line.inventoryItem
                            ? t(`units.${line.inventoryItem.unit}`)
                            : "",
                        })}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                </Card>
              </SwipeableRow>
            ))}
          </ThemedView>
        )}
      </ScrollView>

      {canManage && <Fab icon="add" onPress={() => setShowAddModal(true)} />}

      <DialogModal
        visible={!!lineToDelete}
        title={t("recipe.deleteTitle")}
        message={t("recipe.deleteMessage")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        loading={deleteRecipe.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setLineToDelete(null)}
      />

      <RecipeLineModal
        visible={showAddModal || !!lineToEdit}
        productOptionId={productOptionId}
        recipeLine={lineToEdit}
        onClose={closeLineModal}
      />
    </ScreenLayout>
  );
}
