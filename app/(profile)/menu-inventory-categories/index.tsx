import { useRef, useState } from "react";
import { ScrollView, RefreshControl, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
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
import ActionsBottomSheet from "@/presentation/theme/components/actions-bottom-sheet";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { useInventoryItemCategories } from "@/presentation/inventory/hooks/useInventoryItemCategories";
import type { InventoryItemCategory } from "@/core/inventory/models/inventory-item-category.model";

export default function MenuInventoryCategoriesScreen() {
  const { t } = useTranslation("inventory");
  const { user } = useAuthStore();
  const canManage = isAdminLevelRole(user?.role?.name);
  const { categories, categoriesQuery, deleteCategory, updateCategory } =
    useInventoryItemCategories();

  const [categoryToDelete, setCategoryToDelete] =
    useState<InventoryItemCategory | null>(null);
  const [categoryForOptions, setCategoryForOptions] =
    useState<InventoryItemCategory | null>(null);
  const optionsSheetRef = useRef<BottomSheetMethods>(null);

  const handleCreateCategory = () => {
    router.push({ pathname: "/(profile)/menu-inventory-category-form" });
  };

  const handleEditCategory = (category: InventoryItemCategory) => {
    router.push({
      pathname: "/(profile)/menu-inventory-category-form",
      params: {
        categoryId: category.id,
        name: category.name,
        isActive: String(category.isActive),
      },
    });
  };

  const handleOpenOptions = (category: InventoryItemCategory) => {
    setCategoryForOptions(category);
    optionsSheetRef.current?.present();
  };

  const handleToggleActive = async (category: InventoryItemCategory) => {
    optionsSheetRef.current?.dismiss();
    await updateCategory.mutateAsync({
      id: category.id,
      isActive: !category.isActive,
    });
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    await deleteCategory.mutateAsync(categoryToDelete.id);
    setCategoryToDelete(null);
  };

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ThemedView style={tw`px-4 pt-8 gap-4 bg-transparent`}>
        <ThemedView style={tw`items-center gap-3 flex-row bg-transparent`}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => tw.style(pressed && "opacity-70")}
          >
            <Ionicons name="arrow-back-outline" size={24} />
          </Pressable>
          <ThemedText
            type="h3"
            style={{ fontFamily: typography.medium, flex: 1 }}
            numberOfLines={1}
          >
            {t("categories.title")}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 gap-3.5 pb-8 pt-6`}
        refreshControl={
          <RefreshControl
            refreshing={categoriesQuery.isFetching}
            onRefresh={categoriesQuery.refetch}
            tintColor={tw.color("blue-500")}
            colors={[tw.color("blue-500") || "#3b82f6"]}
          />
        }
      >
        {categoriesQuery.isLoading && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {t("loading")}
            </ThemedText>
          </ThemedView>
        )}

        {categoriesQuery.isError && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <ThemedText type="body1" style={tw`text-red-500`}>
              {t("categories.loadError")}
            </ThemedText>
            <Button
              label={t("retry")}
              onPress={() => categoriesQuery.refetch()}
              variant="outline"
            />
          </ThemedView>
        )}

        {!categoriesQuery.isLoading &&
          !categoriesQuery.isError &&
          categories.length === 0 && (
            <ThemedView style={tw`items-center py-8 gap-3`}>
              <Ionicons name="folder-outline" size={48} color="#999" />
              <ThemedText type="body1" style={tw`font-semibold`}>
                {t("categories.empty")}
              </ThemedText>
              <ThemedText
                type="body2"
                style={tw`text-center text-gray-500 px-4`}
              >
                {t("categories.emptyDescription")}
              </ThemedText>
            </ThemedView>
          )}

        {categories.map((category) => (
          <Card
            key={category.id}
            onPress={
              canManage ? () => handleOpenOptions(category) : undefined
            }
            style={!category.isActive && tw`opacity-50`}
          >
            <ThemedView style={tw`flex-row items-center justify-between`}>
              <ThemedView style={tw`gap-4 flex-1 flex-row items-center`}>
                <Ionicons
                  name="folder-outline"
                  size={24}
                  color={tw.color("text-light-on-surface-variant")}
                />
                <ThemedText type="h4">{category.name}</ThemedText>
              </ThemedView>
              {canManage && (
                <Ionicons
                  name="ellipsis-vertical"
                  size={18}
                  color={tw.color("gray-400")}
                />
              )}
            </ThemedView>
          </Card>
        ))}
      </ScrollView>

      {canManage && (
        <Fab
          icon="add"
          label={t("categories.createCategory")}
          onPress={handleCreateCategory}
        />
      )}

      <DialogModal
        visible={!!categoryToDelete}
        title={t("categories.deleteTitle")}
        message={t("categories.deleteMessage")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        loading={deleteCategory.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setCategoryToDelete(null)}
      />

      <ThemedBottomSheetModal ref={optionsSheetRef} enablePanDownToClose>
        {categoryForOptions && (
          <ActionsBottomSheet
            title={t("categories.manageCategory")}
            subtitle={categoryForOptions.name}
            items={[
              {
                icon: "create-outline",
                label: t("categories.editCategory"),
                onPress: () => {
                  optionsSheetRef.current?.dismiss();
                  handleEditCategory(categoryForOptions);
                },
              },
              {
                icon: "power-outline",
                label: categoryForOptions.isActive
                  ? t("categories.deactivateCategory")
                  : t("categories.activateCategory"),
                onPress: () => handleToggleActive(categoryForOptions),
              },
              {
                icon: "trash-outline",
                label: t("categories.deleteCategory"),
                color: "text-red-600",
                onPress: () => {
                  optionsSheetRef.current?.dismiss();
                  setCategoryToDelete(categoryForOptions);
                },
              },
            ]}
          />
        )}
      </ThemedBottomSheetModal>
    </ScreenLayout>
  );
}
