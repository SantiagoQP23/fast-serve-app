import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { router } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { type BottomSheetMethods } from "@expo/ui/community/bottom-sheet";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import Chip from "@/presentation/theme/components/chip";
import TextInput from "@/presentation/theme/components/text-input";
import IconButton from "@/presentation/theme/components/icon-button";
import Card from "@/presentation/theme/components/card";
import Button from "@/presentation/theme/components/button";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useProductSearch } from "@/presentation/restaurant-menu/hooks/useProductSearch";
import { useMenuManagement } from "@/presentation/menu-management/hooks/useMenuManagement";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import type { Section } from "@/core/menu/models/section.model";
import type { Category } from "@/core/menu/models/category.model";
import {
  getProductDefaultOption,
  type Product,
} from "@/core/menu/models/product.model";
import MenuProductDetailView from "@/presentation/menu-management/components/menu-product-detail-view";
import MenuNamesSheet from "@/presentation/menu-management/components/menu-names-sheet";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";

const PRODUCT_PANE_WIDTH = 600;

export default function MenuOverviewScreen() {
  const { t } = useTranslation("menuManagement");
  const primaryColor = useThemeColor({}, "primary");
  const { sections, categories, products, menuQuery } = useMenu();
  const { isLoading, isError, refetch, isRefetching } = menuQuery;
  const { createSection, createCategory } = useMenuManagement();
  const { user, currentRestaurant } = useAuthStore();
  const menuRestaurantId = useMenuStore((state) => state.restaurantId);
  const canManage = isAdminLevelRole(user?.role?.name);

  const [sectionId, setSectionId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const sectionSheetRef = useRef<BottomSheetMethods>(null);
  const categorySheetRef = useRef<BottomSheetMethods>(null);

  // Tablet landscape: the selected product opens in a pane next to the menu
  const { isExpanded } = useResponsiveLayout();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );

  const sortedSections = useMemo(
    () => sections.slice().sort((a, b) => a.order - b.order),
    [sections],
  );

  const sectionCategories = useMemo(
    () => categories.filter((category) => category.sectionId === sectionId),
    [categories, sectionId],
  );

  const getSectionName = (id: string) =>
    sections.find((section) => section.id === id)?.name ?? "";

  // Also recovers when the selected section is deleted from its form
  useEffect(() => {
    if (sortedSections.length === 0) return;
    if (!sortedSections.some((section) => section.id === sectionId)) {
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

  const searchResults = useProductSearch(products, search);
  const filteredProducts = useMemo(() => {
    if (search.trim()) return searchResults;
    return products.filter((product) => product.category.id === categoryId);
  }, [products, search, searchResults, categoryId]);

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

  const handleSelectSection = (section: Section) => {
    if (sectionId === section.id) {
      if (!canManage) return;
      router.push({
        pathname: "/(profile)/menu/sections/form",
        params: {
          sectionId: section.id,
          name: section.name,
          isPublic: String(section.isPublic),
          isActive: String(section.isActive),
        },
      });
      return;
    }
    setSectionId(section.id);
  };

  const handleSelectCategory = (category: Category) => {
    if (categoryId === category.id) {
      if (!canManage) return;
      router.push({
        pathname: "/(profile)/menu/categories/form",
        params: {
          categoryId: category.id,
          name: category.name,
          sectionId: category.sectionId,
          isPublic: String(category.isPublic),
          isActive: String(category.isActive),
        },
      });
      return;
    }
    setCategoryId(category.id);
  };

  const handleAddSection = () => {
    sectionSheetRef.current?.present();
  };

  const handleAddCategory = () => {
    if (!sectionId) {
      handleAddSection();
      return;
    }
    categorySheetRef.current?.present();
  };

  const handleAddProduct = () => {
    router.push({
      pathname: "/(profile)/menu/products/form",
      params: categoryId ? { categoryId } : undefined,
    });
  };

  const openProduct = (product: Product) => {
    if (isExpanded) {
      setSelectedProductId(product.id);
      return;
    }
    router.push({
      pathname: "/(profile)/menu/products/detail",
      params: { productId: product.id },
    });
  };

  const hasMenu =
    sections.length > 0 || categories.length > 0 || products.length > 0;
  // The menu came back from the server (snapshot, sync or this screen's
  // query) and it really is empty, as opposed to never loaded.
  const isMenuLoaded =
    menuQuery.isSuccess ||
    (!!currentRestaurant?.id && menuRestaurantId === currentRestaurant.id);

  const nameSheets = canManage && (
    <>
      <MenuNamesSheet
        sheetRef={sectionSheetRef}
        title={t("overview.namesSheet.sectionsTitle")}
        placeholder={t("overview.namesSheet.sectionPlaceholder")}
        existingNames={sections.map((section) => section.name)}
        createOne={(name) => createSection.mutateAsync({ name })}
        onCreated={(created) => {
          setSearch("");
          setSectionId(created[0].id);
        }}
      />
      <MenuNamesSheet
        sheetRef={categorySheetRef}
        title={t("overview.namesSheet.categoriesTitle")}
        subtitle={t("overview.namesSheet.inSection", {
          section: getSectionName(sectionId),
        })}
        placeholder={t("overview.namesSheet.categoryPlaceholder")}
        existingNames={categories.map((category) => category.name)}
        createOne={(name) => createCategory.mutateAsync({ name, sectionId })}
        onCreated={(created) => {
          setSearch("");
          setCategoryId(created[0].id);
        }}
      />
    </>
  );

  if (!hasMenu && isMenuLoaded && !menuQuery.isError) {
    return (
      <ThemedView
        style={tw`flex-1 px-4 pt-8 items-center justify-center gap-4`}
      >
        <Icon name="utensils" size={64} color={tw.color("gray-400")} />
        <ThemedView style={tw`gap-2 items-center`}>
          <ThemedText type="h2">{t("overview.empty.title")}</ThemedText>
          <ThemedText type="body2" style={tw`text-center text-gray-500 px-8`}>
            {canManage
              ? t("overview.empty.description")
              : t("overview.empty.descriptionReadOnly")}
          </ThemedText>
        </ThemedView>
        {canManage && (
          <Button
            label={t("overview.empty.createFirstSection")}
            leftIcon="plus"
            onPress={handleAddSection}
          />
        )}
        {nameSheets}
      </ThemedView>
    );
  }

  if (!hasMenu) {
    return (
      <ThemedView
        style={tw`flex-1 px-4 pt-8 items-center justify-center gap-4`}
      >
        <Icon name="utensils" size={64} color={tw.color("gray-400")} />
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
          leftIcon="cloud-download"
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

  const menu = (
    <ScreenLayout fullWidth={isExpanded} style={tw`px-4 pt-2 flex-1 gap-4`}>
      {isLoading && sections.length === 0 && (
        <ThemedView style={tw`items-center py-8 gap-3`}>
          <Icon name="utensils" size={48} color={tw.color("gray-400")} />
          <ThemedText type="body1" style={tw`text-gray-500`}>
            {t("loading")}
          </ThemedText>
        </ThemedView>
      )}

      {isError && sections.length === 0 && (
        <ThemedView style={tw`items-center py-8 gap-3`}>
          <Icon name="circle-alert" size={48} color={tw.color("red-500")} />
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
        icon="search"
        trailingIcon={
          search && (
            <IconButton
              icon="circle-x"
              onPress={() => setSearch("")}
            ></IconButton>
          )
        }
      />

      {!search && (
        <ThemedView style={tw`gap-2`}>
          <ColumnLabel>{t("sections.title")}</ColumnLabel>
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
                label={t("overview.add")}
                icon="plus"
                onPress={handleAddSection}
              />
            )}
          </ScrollView>
        </ThemedView>
      )}

      <ThemedView style={tw`flex-row gap-2 flex-1`}>
        {!search && (
          <ThemedView style={tw`w-30 flex-shrink-0 gap-2`}>
            <ColumnLabel>{t("categories.title")}</ColumnLabel>
            <ScrollView
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
                  label={t("overview.add")}
                  icon="plus"
                  onPress={handleAddCategory}
                />
              )}
            </ScrollView>
          </ThemedView>
        )}
        <ThemedView
          style={tw`gap-2 ${search ? "flex-1" : "w-[70%] flex-shrink-0"}`}
        >
          <ColumnLabel>{t("products.title")}</ColumnLabel>
          <ScrollView
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
                leftIcon="plus"
                variant="outline"
                onPress={handleAddProduct}
              />
            )}
            {filteredProducts.length === 0 && (
              <ThemedView style={tw`items-center py-8 gap-3`}>
                <Icon name="hamburger" size={40} color={tw.color("gray-400")} />
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
                style={tw.style(
                  !product.isActive && "opacity-50",
                  isExpanded &&
                    selectedProductId === product.id &&
                    "bg-secondary",
                )}
              >
                <ThemedView style={tw`flex-row items-center justify-between`}>
                  <ThemedView style={tw`gap-4 flex-1 flex-row items-center`}>
                    {/* <Icon */}
                    {/*   name="fast-food-outline" */}
                    {/*   size={28} */}
                    {/*   color={tw.color("text-on-surface-variant")} */}
                    {/* /> */}
                    <ThemedView style={tw`flex-1 gap-2`}>
                      <ThemedText type="body1">{product.name}</ThemedText>
                      <ThemedText type="body2" style={tw`text-gray-500`}>
                        {product.options.length > 1
                          ? product.options
                              .map((option) => option.name)
                              .join(" - ")
                          : `$${(getProductDefaultOption(product)?.price ?? 0).toFixed(2)}`}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              </Card>
            ))}
          </ScrollView>
        </ThemedView>
      </ThemedView>

      {nameSheets}
    </ScreenLayout>
  );

  if (!isExpanded) return menu;

  return (
    <ThemedView style={tw`flex-1 flex-row bg-background`}>
      <ThemedView style={tw`flex-1`}>{menu}</ThemedView>
      <ThemedView
        style={[
          tw`border-l border-outline-variant`,
          { width: PRODUCT_PANE_WIDTH },
        ]}
      >
        {selectedProductId ? (
          <MenuProductDetailView
            key={selectedProductId}
            productId={selectedProductId}
            embedded
            onClose={() => setSelectedProductId(null)}
            onOpenProduct={setSelectedProductId}
          />
        ) : (
          <ThemedView style={tw`flex-1 items-center justify-center gap-4 px-8`}>
            <Icon name="hamburger" size={64} color={tw.color("gray-400")} />
            <ThemedText type="h3">{t("overview.pane.emptyTitle")}</ThemedText>
            <ThemedText type="body2" style={tw`text-center max-w-xs`}>
              {t("overview.pane.emptyDescription")}
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </ThemedView>
  );
}

function ColumnLabel({ children }: { children: string }) {
  return (
    <ThemedText type="small" style={tw`text-gray-500 ml-1`}>
      {children}
    </ThemedText>
  );
}
