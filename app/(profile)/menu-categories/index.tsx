import { useEffect, useRef, useState } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { type BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useMenuManagement } from "@/presentation/menu-management/hooks/useMenuManagement";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Roles, isValidRole } from "@/core/auth/models/user.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Fab from "@/presentation/theme/components/fab";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import IconButton from "@/presentation/theme/components/icon-button";
import type { Category } from "@/core/menu/models/category.model";
import { typography } from "@/constants/theme";

export default function MenuCategoriesScreen() {
  const { t } = useTranslation("menuManagement");
  const { categories, products, menuQuery } = useMenu();
  const { isLoading, isError, refetch, isRefetching } = menuQuery;
  const { updateCategory, deleteCategory } = useMenuManagement();
  const { user } = useAuthStore();
  const canManage = isValidRole(user?.role?.name, [Roles.ADMIN, Roles.OWNER]);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const actionsSheetRef = useRef<BottomSheetMethods>(null);

  useEffect(() => {
    if (categories.length === 0) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateCategory = () => {
    router.push("/(profile)/menu-category-form");
  };

  const handleEditCategory = (category: Category) => {
    router.push({
      pathname: "/(profile)/menu-category-form",
      params: {
        categoryId: category.id,
        name: category.name,
        sectionId: category.section.id,
        isActive: String(category.isActive),
        isPublic: String(category.isPublic),
      },
    });
  };

  const handleViewCategory = (category: Category) => {
    router.push({
      pathname: "/(profile)/menu-category-products",
      params: {
        categoryId: category.id,
        name: category.name,
        sectionId: category.section.id,
        isActive: String(category.isActive),
        isPublic: String(category.isPublic),
      },
    });
  };

  const getProductCount = (categoryId: string) =>
    products.filter((product) => product.category.id === categoryId).length;

  const handleOpenCategoryActions = (category: Category) => {
    setSelectedCategory(category);
    actionsSheetRef.current?.present();
  };

  const handleCloseCategoryActions = () => {
    actionsSheetRef.current?.dismiss();
  };

  const handleToggleActive = () => {
    if (!selectedCategory) return;
    updateCategory.mutate({
      id: selectedCategory.id,
      isActive: !selectedCategory.isActive,
    });
    handleCloseCategoryActions();
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    await deleteCategory.mutateAsync(categoryToDelete.id);
    setCategoryToDelete(null);
  };

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-2`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-4 pb-8`}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={tw.color("blue-500")}
            colors={[tw.color("blue-500") || "#3b82f6"]}
          />
        }
      >
        {isLoading && categories.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="pricetag-outline" size={48} color="#999" />
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {t("loading")}
            </ThemedText>
          </ThemedView>
        )}

        {isError && categories.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <ThemedText type="body1" style={tw`text-red-500`}>
              {t("loadError")}
            </ThemedText>
            <Button
              label={t("retry")}
              onPress={() => refetch()}
              variant="outline"
            />
          </ThemedView>
        )}

        {!isLoading && !isError && categories.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="pricetag-outline" size={48} color="#999" />
            <ThemedText type="body1" style={tw`font-semibold`}>
              {t("categories.noCategories")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {t("categories.noCategoriesDescription")}
            </ThemedText>
          </ThemedView>
        )}

        {categories.length > 0 && (
          <ThemedView style={tw`gap-4`}>
            {categories.map((category) => (
              <Card
                key={category.id}
                onPress={() => handleViewCategory(category)}
                style={!category.isActive && tw`opacity-50`}
              >
                <ThemedView style={tw`flex-row items-center justify-between`}>
                  <ThemedView style={tw`gap-4 flex-1 flex-row items-center`}>
                    <Ionicons
                      name="pricetag-outline"
                      size={28}
                      color={tw.color("text-light-on-surface-variant")}
                    />
                    <ThemedView style={tw`flex-1 gap-2`}>
                      <ThemedText type="h4">{category.name}</ThemedText>
                      <ThemedView style={tw`flex-row items-center gap-2 flex-wrap`}>
                        <ThemedText type="small" style={tw`text-gray-500`}>
                          {category.section.name}
                        </ThemedText>
                        <ThemedText type="small" style={tw`text-gray-500`}>
                          •
                        </ThemedText>
                        <ThemedText type="small" style={tw`text-gray-500`}>
                          {t("categories.productCount", {
                            count: getProductCount(category.id),
                          })}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                  </ThemedView>
                  {canManage && (
                    <IconButton
                      icon="ellipsis-vertical"
                      size={18}
                      variant="text"
                      onPress={() => handleOpenCategoryActions(category)}
                    />
                  )}
                </ThemedView>
              </Card>
            ))}
          </ThemedView>
        )}
      </ScrollView>

      {canManage && <Fab icon="add" onPress={handleCreateCategory} />}

      <ThemedBottomSheetModal ref={actionsSheetRef} enablePanDownToClose>
        {selectedCategory && (
          <ThemedView style={tw`px-4 py-4 gap-6`}>
            <ThemedView style={tw`flex-row justify-between items-start gap-3`}>
              <ThemedView style={tw`flex-1 gap-2`}>
                <ThemedText type="h2" style={{ fontFamily: typography.medium }}>
                  {selectedCategory.name}
                </ThemedText>
                <ThemedView style={tw`flex-row items-center gap-2 flex-wrap`}>
                  <ThemedView style={tw`flex-row items-center gap-1`}>
                    <Ionicons
                      name="list-outline"
                      size={16}
                      color={tw.color("text-gray-500")}
                    />
                    <ThemedText type="small" style={tw`text-gray-500`}>
                      {selectedCategory.section.name}
                    </ThemedText>
                  </ThemedView>
                  <ThemedView style={tw`flex-row items-center gap-1`}>
                    <Ionicons
                      name="pricetag-outline"
                      size={16}
                      color={tw.color("text-gray-500")}
                    />
                    <ThemedText type="small" style={tw`text-gray-500`}>
                      {t("categories.productCount", {
                        count: getProductCount(selectedCategory.id),
                      })}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
              <IconButton
                icon={
                  selectedCategory.isActive ? "eye-outline" : "eye-off-outline"
                }
                variant="secondary"
                onPress={handleToggleActive}
              />
            </ThemedView>
            <ThemedView style={tw`flex-row gap-4 items-center`}>
              <Button
                label={t("delete")}
                leftIcon="trash"
                variant="destructive"
                onPress={() => {
                  handleCloseCategoryActions();
                  setCategoryToDelete(selectedCategory);
                }}
              />
              <Button
                label={t("edit")}
                leftIcon="create"
                variant="secondary"
                style={tw`flex-1`}
                onPress={() => {
                  handleCloseCategoryActions();
                  handleEditCategory(selectedCategory);
                }}
              />
            </ThemedView>
          </ThemedView>
        )}
      </ThemedBottomSheetModal>

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
    </ScreenLayout>
  );
}
