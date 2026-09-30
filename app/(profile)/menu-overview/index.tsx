import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { type BottomSheetMethods } from "@expo/ui/community/bottom-sheet";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import Chip from "@/presentation/theme/components/chip";
import TextInput from "@/presentation/theme/components/text-input";
import IconButton from "@/presentation/theme/components/icon-button";
import Card from "@/presentation/theme/components/card";
import Button from "@/presentation/theme/components/button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useMenuManagement } from "@/presentation/menu-management/hooks/useMenuManagement";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import type { Section } from "@/core/menu/models/section.model";
import type { Category } from "@/core/menu/models/category.model";
import type { Product } from "@/core/menu/models/product.model";
import { typography } from "@/constants/theme";

type SelectedEntity =
  | { type: "section"; item: Section }
  | { type: "category"; item: Category };

export default function MenuOverviewScreen() {
  const { t } = useTranslation("menuManagement");
  const primaryColor = useThemeColor({}, "primary");
  const { sections, categories, products, menuQuery } = useMenu();
  const { isLoading, isError, refetch, isRefetching } = menuQuery;
  const { updateSection, deleteSection, updateCategory, deleteCategory } =
    useMenuManagement();
  const { user } = useAuthStore();
  const canManage = isAdminLevelRole(user?.role?.name);

  const [sectionId, setSectionId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [selected, setSelected] = useState<SelectedEntity | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );
  const actionsSheetRef = useRef<BottomSheetMethods>(null);

  const sortedSections = useMemo(
    () => sections.slice().sort((a, b) => a.order - b.order),
    [sections],
  );

  const sectionCategories = useMemo(
    () => categories.filter((category) => category.section.id === sectionId),
    [categories, sectionId],
  );

  const getCategoryCount = (id: string) =>
    categories.filter((category) => category.section.id === id).length;

  const getProductCount = (id: string) =>
    products.filter((product) => product.category.id === id).length;

  useEffect(() => {
    if (!sectionId && sortedSections.length > 0) {
      setSectionId(sortedSections[0].id);
    }
  }, [sortedSections, sectionId]);

  useEffect(() => {
    if (!sectionId) return;
    if (sectionCategories.some((category) => category.id === categoryId)) {
      return;
    }
    setCategoryId(sectionCategories[0]?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId, sectionCategories]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query) {
      return products.filter((product) =>
        product.name.toLowerCase().includes(query),
      );
    }
    return products.filter((product) => product.category.id === categoryId);
  }, [products, search, categoryId]);

  const handleLoadMenu = async () => {
    setIsLoadingMenu(true);
    try {
      await menuQuery.refetch();
    } catch (error) {
      // Error is handled by React Query
    } finally {
      setIsLoadingMenu(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await menuQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [menuQuery]);

  const closeActions = () => actionsSheetRef.current?.dismiss();

  const handleSelectSection = (section: Section) => {
    if (sectionId === section.id) {
      if (!canManage) return;
      setSelected({ type: "section", item: section });
      actionsSheetRef.current?.present();
      return;
    }
    setSectionId(section.id);
  };

  const handleSelectCategory = (category: Category) => {
    if (categoryId === category.id) {
      if (!canManage) return;
      setSelected({ type: "category", item: category });
      actionsSheetRef.current?.present();
      return;
    }
    setCategoryId(category.id);
  };

  const handleAddSection = () => {
    router.push("/(profile)/menu-section-form");
  };

  const handleAddCategory = () => {
    router.push({
      pathname: "/(profile)/menu-category-form",
      params: sectionId ? { sectionId } : undefined,
    });
  };

  const handleAddProduct = () => {
    router.push({
      pathname: "/(profile)/menu-product-form",
      params: categoryId ? { categoryId } : undefined,
    });
  };

  const handleEditSelected = () => {
    if (!selected) return;
    closeActions();
    if (selected.type === "section") {
      router.push({
        pathname: "/(profile)/menu-section-form",
        params: {
          sectionId: selected.item.id,
          name: selected.item.name,
          isPublic: String(selected.item.isPublic),
        },
      });
    } else {
      router.push({
        pathname: "/(profile)/menu-category-form",
        params: {
          categoryId: selected.item.id,
          name: selected.item.name,
          sectionId: selected.item.section.id,
          isPublic: String(selected.item.isPublic),
        },
      });
    }
  };

  const handleToggleSelectedActive = () => {
    if (!selected) return;
    if (selected.type === "section") {
      updateSection.mutate({
        id: selected.item.id,
        isActive: !selected.item.isActive,
      });
    } else {
      updateCategory.mutate({
        id: selected.item.id,
        isActive: !selected.item.isActive,
      });
    }
    closeActions();
  };

  const handleDeleteSelected = () => {
    if (!selected) return;
    closeActions();
    if (selected.type === "section") {
      setSectionToDelete(selected.item);
    } else {
      setCategoryToDelete(selected.item);
    }
  };

  const handleConfirmDeleteSection = async () => {
    if (!sectionToDelete) return;
    await deleteSection.mutateAsync(sectionToDelete.id);
    setSectionToDelete(null);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    await deleteCategory.mutateAsync(categoryToDelete.id);
    setCategoryToDelete(null);
  };

  const openProduct = (product: Product) => {
    router.push({
      pathname: "/(profile)/menu-product-detail",
      params: { productId: product.id },
    });
  };

  const hasMenu =
    sections.length > 0 || categories.length > 0 || products.length > 0;

  if (!hasMenu) {
    return (
      <ThemedView
        style={tw`flex-1 px-4 pt-8 items-center justify-center gap-4`}
      >
        <Ionicons name="restaurant-outline" size={64} color="#999" />
        <ThemedView style={tw`gap-2 items-center`}>
          <ThemedText type="h2">{t("overview.noMenu.title")}</ThemedText>
          <ThemedText type="body2" style={tw`text-center text-gray-500 px-8`}>
            {t("overview.noMenu.description")}
          </ThemedText>
        </ThemedView>
        <Button
          label={
            menuQuery.isError
              ? t("overview.noMenu.retry")
              : isLoadingMenu
                ? t("overview.noMenu.loading")
                : t("overview.noMenu.loadButton")
          }
          leftIcon="cloud-download-outline"
          onPress={handleLoadMenu}
          disabled={isLoadingMenu}
          loading={isLoadingMenu}
        />
        {menuQuery.isError && (
          <ThemedText type="body2" style={tw`text-red-500 text-center px-8`}>
            {t("overview.noMenu.error")}
          </ThemedText>
        )}
      </ThemedView>
    );
  }

  return (
    <ScreenLayout style={tw`px-4 pt-2 flex-1 gap-4`}>
      {isLoading && sections.length === 0 && (
        <ThemedView style={tw`items-center py-8 gap-3`}>
          <Ionicons name="restaurant-outline" size={48} color="#999" />
          <ThemedText type="body1" style={tw`text-gray-500`}>
            {t("loading")}
          </ThemedText>
        </ThemedView>
      )}

      {isError && sections.length === 0 && (
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

      <TextInput
        value={search}
        placeholder={t("products.searchPlaceholder")}
        onChangeText={setSearch}
        icon="search-outline"
        trailingIcon={
          search && (
            <IconButton
              icon="close-circle-outline"
              onPress={() => setSearch("")}
            ></IconButton>
          )
        }
      />

      {!search && (
        <ThemedView>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={tw`gap-2`}
          >
            {sortedSections.map((section) => (
              <ThemedView
                style={[tw`mr-2`, !section.isActive && tw`opacity-50`]}
                key={section.id}
              >
                <Chip
                  label={section.name}
                  selected={sectionId === section.id}
                  onPress={() => handleSelectSection(section)}
                />
              </ThemedView>
            ))}
            {canManage && (
              <Chip
                label={t("overview.addSection")}
                icon="add"
                onPress={handleAddSection}
              />
            )}
          </ScrollView>
        </ThemedView>
      )}

      <ThemedView style={tw`flex-row gap-2 flex-1`}>
        {!search && (
          <ScrollView
            style={tw`w-30 flex-shrink-0`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={tw`gap-2`}
          >
            {sectionCategories.map((category) => (
              <ThemedView
                key={category.id}
                style={!category.isActive && tw`opacity-50`}
              >
                <Chip
                  label={category.name}
                  selected={categoryId === category.id}
                  onPress={() => handleSelectCategory(category)}
                />
              </ThemedView>
            ))}
            {canManage && (
              <Chip
                label={t("overview.addCategory")}
                icon="add"
                onPress={handleAddCategory}
              />
            )}
          </ScrollView>
        )}
        <ScrollView
          style={tw`${search ? "flex-1" : "w-[70%] flex-shrink-0"}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`gap-3 pb-8`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || isRefetching}
              onRefresh={onRefresh}
              tintColor={primaryColor}
              colors={[primaryColor]}
            />
          }
        >
          {canManage && (
            <Button
              label={t("products.newProduct")}
              leftIcon="add"
              variant="outline"
              onPress={handleAddProduct}
            />
          )}
          {filteredProducts.length === 0 && (
            <ThemedView style={tw`items-center py-8 gap-3`}>
              <Ionicons name="fast-food-outline" size={40} color="#999" />
              <ThemedText
                type="body2"
                style={tw`text-center text-gray-500 px-4`}
              >
                {t("products.noProducts")}
              </ThemedText>
            </ThemedView>
          )}
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              onPress={() => openProduct(product)}
              style={!product.isActive && tw`opacity-50`}
            >
              <ThemedView style={tw`flex-row items-center justify-between`}>
                <ThemedView style={tw`gap-4 flex-1 flex-row items-center`}>
                  {/* <Ionicons */}
                  {/*   name="fast-food-outline" */}
                  {/*   size={28} */}
                  {/*   color={tw.color("text-light-on-surface-variant")} */}
                  {/* /> */}
                  <ThemedView style={tw`flex-1 gap-2`}>
                    <ThemedText type="body1">{product.name}</ThemedText>
                    <ThemedText type="small" style={tw`text-gray-500`}>
                      ${product.price?.toFixed(2)}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
            </Card>
          ))}
        </ScrollView>
      </ThemedView>

      <ThemedBottomSheetModal ref={actionsSheetRef} enablePanDownToClose>
        {selected && (
          <ThemedView style={tw`px-4 py-4 gap-6`}>
            <ThemedView style={tw`flex-row justify-between items-start gap-3`}>
              <ThemedView style={tw`flex-1 gap-2`}>
                <ThemedText type="h2" style={{ fontFamily: typography.medium }}>
                  {selected.item.name}
                </ThemedText>
                <ThemedView style={tw`flex-row items-center gap-2 flex-wrap`}>
                  {selected.type === "section" ? (
                    <ThemedView style={tw`flex-row items-center gap-1`}>
                      <Ionicons
                        name="list-outline"
                        size={16}
                        color={tw.color("text-gray-500")}
                      />
                      <ThemedText type="small" style={tw`text-gray-500`}>
                        {t("sections.categoryCount", {
                          count: getCategoryCount(selected.item.id),
                        })}
                      </ThemedText>
                    </ThemedView>
                  ) : (
                    <>
                      <ThemedView style={tw`flex-row items-center gap-1`}>
                        <Ionicons
                          name="list-outline"
                          size={16}
                          color={tw.color("text-gray-500")}
                        />
                        <ThemedText type="small" style={tw`text-gray-500`}>
                          {selected.item.section.name}
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
                            count: getProductCount(selected.item.id),
                          })}
                        </ThemedText>
                      </ThemedView>
                    </>
                  )}
                </ThemedView>
              </ThemedView>
              <IconButton
                icon={
                  selected.item.isActive ? "eye-outline" : "eye-off-outline"
                }
                variant="secondary"
                onPress={handleToggleSelectedActive}
              />
            </ThemedView>
            <ThemedView style={tw`flex-row gap-4 items-center`}>
              <Button
                label={t("delete")}
                leftIcon="trash"
                variant="destructive"
                onPress={handleDeleteSelected}
              />
              <Button
                label={t("edit")}
                leftIcon="create"
                variant="secondary"
                style={tw`flex-1`}
                onPress={handleEditSelected}
              />
            </ThemedView>
          </ThemedView>
        )}
      </ThemedBottomSheetModal>

      <DialogModal
        visible={!!sectionToDelete}
        title={t("sections.deleteTitle")}
        message={t("sections.deleteMessage")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        loading={deleteSection.isPending}
        onConfirm={handleConfirmDeleteSection}
        onCancel={() => setSectionToDelete(null)}
      />

      <DialogModal
        visible={!!categoryToDelete}
        title={t("categories.deleteTitle")}
        message={t("categories.deleteMessage")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        loading={deleteCategory.isPending}
        onConfirm={handleConfirmDeleteCategory}
        onCancel={() => setCategoryToDelete(null)}
      />
    </ScreenLayout>
  );
}
