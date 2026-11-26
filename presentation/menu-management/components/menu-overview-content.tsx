import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BackHandler,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import {
  type BottomSheetMethods,
  BottomSheetView,
} from "@expo/ui/community/bottom-sheet";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import RadioButton from "@/presentation/theme/components/radio-button";
import TextInput from "@/presentation/theme/components/text-input";
import IconButton from "@/presentation/theme/components/icon-button";
import Button from "@/presentation/theme/components/button";
import Label from "@/presentation/theme/components/label";
import DetailHeader from "@/presentation/theme/components/detail-header";
import TabPager from "@/presentation/theme/components/tab-pager";
import ActionsBottomSheet, {
  type ActionsBottomSheetSection,
} from "@/presentation/theme/components/actions-bottom-sheet";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import AdjustStockModal from "@/presentation/inventory/components/adjust-stock-modal";
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import InventorySplitLayout from "@/presentation/inventory/components/inventory-split-layout";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useProductSearch } from "@/presentation/restaurant-menu/hooks/useProductSearch";
import { useMenuManagement } from "@/presentation/menu-management/hooks/useMenuManagement";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import {
  canManageInventory,
  isAdminLevelRole,
} from "@/core/auth/models/user.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import type { Section } from "@/core/menu/models/section.model";
import type { Category } from "@/core/menu/models/category.model";
import {
  getProductActiveOptions,
  getProductStockAttention,
  getProductStockSummary,
  type Product,
} from "@/core/menu/models/product.model";
import { getVariantStockMode } from "@/core/menu/models/product-optionl.model";
import { getOwnStockLine } from "@/core/inventory/models/inventory-recipe.model";
import type { InventoryItem } from "@/core/inventory/models/inventory-item.model";
import MenuProductCard from "@/presentation/menu-management/components/menu-product-card";
import MenuProductDetailView from "@/presentation/menu-management/components/menu-product-detail-view";
import SectionTabBar from "@/presentation/menu-management/components/section-tab-bar";
import MenuNamesSheet from "@/presentation/menu-management/components/menu-names-sheet";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { openProductForm } from "@/presentation/menu-management/utils/open-product-form";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";

const CATEGORY_COLUMN_WIDTH = 136;
// A group becomes "current" once its header passes this share of the list.
const CATEGORY_SPY_RATIO = 0.3;
// Ignore scroll-spy while a tap-triggered scroll animates to its group.
const CATEGORY_SCROLL_LOCK_MS = 600;
// After a section change, once the old section has slid off screen
const SECTION_RESET_DELAY_MS = 300;

type StockFilter = "out" | "low";

/** A variant's own stock, for restocking it from the product's actions. */
interface OwnStock {
  variantName: string;
  item: InventoryItem;
}

function getOwnStocks(product: Product): OwnStock[] {
  return getProductActiveOptions(product).flatMap((option) => {
    if (getVariantStockMode(option) !== "own") return [];
    const item = getOwnStockLine(option.inventoryItems)?.inventoryItem;
    return item ? [{ variantName: option.name, item }] : [];
  });
}

/**
 * The restaurant menu (sections, categories, products) with each product's
 * stock, opened from the Productos hub. Browses like the ordering menu: one
 * page per section, categories in a rail synced to the grouped products.
 */
export default function MenuOverviewContent() {
  const { t } = useTranslation("menuManagement");
  const { t: tInventory } = useTranslation("inventory");
  const primaryColor = useThemeColor({}, "primary");
  const { sections, categories, products, menuQuery } = useMenu();
  const { isLoading, isError, refetch, isRefetching } = menuQuery;
  const { createSection, createCategory, updateSection, updateProduct } =
    useMenuManagement();
  const { user, currentRestaurant } = useAuthStore();
  const menuRestaurantId = useMenuStore((state) => state.restaurantId);
  const canManage = isAdminLevelRole(user?.role?.name);
  const canAdjustStock = canManageInventory(user?.role?.name);

  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [stockFilter, setStockFilter] = useState<StockFilter | null>(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const sectionSheetRef = useRef<BottomSheetMethods>(null);
  const categorySheetRef = useRef<BottomSheetMethods>(null);
  const filterSheetRef = useRef<BottomSheetMethods>(null);
  const productActionsSheetRef = useRef<BottomSheetMethods>(null);
  const [actionsProduct, setActionsProduct] = useState<Product | null>(null);
  const [adjusting, setAdjusting] = useState<{
    item: InventoryItem;
    mode: "restock" | "decrease";
  } | null>(null);

  // Tablet landscape: the selected product opens in a pane next to the menu
  const { isExpanded } = useResponsiveLayout();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );

  // Inactive sections stay listed: this is where they get turned back on.
  const sortedSections = useMemo(
    () => sections.slice().sort((a, b) => a.order - b.order),
    [sections],
  );
  const sectionTabs = useMemo(
    () =>
      sortedSections.map((section) => ({
        label: section.name,
        value: section.id,
      })),
    [sortedSections],
  );
  // Also recovers when the selected section is deleted from its form
  const currentSection =
    sortedSections.find((section) => section.id === selectedSectionId) ??
    sortedSections[0];
  const sectionId = currentSection?.id ?? "";

  const productsByCategory = useMemo(() => {
    const byCategory = new Map<string, Product[]>();
    for (const product of products) {
      const id = product.category?.id;
      if (!id) continue;
      const list = byCategory.get(id);
      if (list) list.push(product);
      else byCategory.set(id, [product]);
    }
    return byCategory;
  }, [products]);

  // Empty categories stay listed so a new one doesn't seem to vanish.
  const categoriesOfSection = useCallback(
    (id: string) => categories.filter((category) => category.sectionId === id),
    [categories],
  );
  const sectionCategories = useMemo(
    () => categoriesOfSection(sectionId),
    [categoriesOfSection, sectionId],
  );
  const categoryId = sectionCategories.some(
    (category) => category.id === selectedCategoryId,
  )
    ? selectedCategoryId
    : (sectionCategories[0]?.id ?? "");

  const stockSummaries = useMemo(
    () =>
      new Map(
        products.map((product) => [
          product.id,
          getProductStockSummary(product),
        ]),
      ),
    [products],
  );
  const stockCounts = useMemo(() => {
    let out = 0;
    let low = 0;
    for (const product of products) {
      if (!product.isActive) continue;
      const summary = stockSummaries.get(product.id);
      if (!summary) continue;
      const attention = getProductStockAttention(summary);
      if (attention === "out") out += 1;
      else if (attention === "low") low += 1;
    }
    return { out, low };
  }, [products, stockSummaries]);
  const activeProductCount = useMemo(
    () => products.filter((product) => product.isActive).length,
    [products],
  );

  const matchesStockFilter = useCallback(
    (product: Product) => {
      if (!stockFilter || !product.isActive) return !stockFilter;
      const summary = stockSummaries.get(product.id);
      return !!summary && getProductStockAttention(summary) === stockFilter;
    },
    [stockFilter, stockSummaries],
  );

  // A search or a stock filter spans the whole menu, not one section.
  const hasSearch = !!search.trim();
  const isFiltering = hasSearch || !!stockFilter;

  // Back clears the search, then the stock filter, before it leaves the
  // screen
  useFocusEffect(
    useCallback(() => {
      if (!isFiltering) return;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (hasSearch) setSearch("");
          else setStockFilter(null);
          return true;
        },
      );
      return () => subscription.remove();
    }, [isFiltering, hasSearch]),
  );
  const searchResults = useProductSearch(products, search);
  const filteredProducts = useMemo(
    () =>
      isFiltering
        ? (hasSearch ? searchResults : products).filter(matchesStockFilter)
        : [],
    [products, hasSearch, searchResults, isFiltering, matchesStockFilter],
  );

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

  const productsScrollRef = useRef<ScrollView>(null);
  // Top of each category group inside the product list.
  const categoryGroupY = useRef(new Map<string, number>());
  const productsHeight = useRef(0);
  const isAutoScrolling = useRef(false);
  const autoScrollTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(autoScrollTimer.current), []);

  const onChangeSection = useCallback((value: string) => {
    setSelectedSectionId(value);
    setSelectedCategoryId("");
    // The section left behind starts from the top next time; reset it once
    // it has slid off screen.
    const leaving = productsScrollRef.current;
    setTimeout(
      () => leaving?.scrollTo({ y: 0, animated: false }),
      SECTION_RESET_DELAY_MS,
    );
  }, []);

  const onSelectCategory = (id: string) => {
    setSelectedCategoryId(id);
    const y = categoryGroupY.current.get(id);
    if (y === undefined) return;
    isAutoScrolling.current = true;
    clearTimeout(autoScrollTimer.current);
    autoScrollTimer.current = setTimeout(() => {
      isAutoScrolling.current = false;
    }, CATEGORY_SCROLL_LOCK_MS);
    productsScrollRef.current?.scrollTo({ y, animated: true });
  };

  // Highlight the category whose group is at the top of the list.
  const onProductsScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isAutoScrolling.current || sectionCategories.length === 0) return;
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    // At the very bottom the last group may never reach the line; pick it.
    const atEnd =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 1;
    if (atEnd) {
      setSelectedCategoryId(sectionCategories[sectionCategories.length - 1].id);
      return;
    }
    const y = contentOffset.y + productsHeight.current * CATEGORY_SPY_RATIO;
    let current = sectionCategories[0].id;
    for (const category of sectionCategories) {
      const top = categoryGroupY.current.get(category.id);
      if (top !== undefined && top <= y) current = category.id;
    }
    setSelectedCategoryId(current);
  };

  const editSection = (section: Section) => {
    router.push({
      pathname: "/(profile)/menu/sections/form",
      params: {
        sectionId: section.id,
        name: section.name,
        isPublic: String(section.isPublic),
        isActive: String(section.isActive),
      },
    });
  };

  const editCategory = (category: Category) => {
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

  // Lands in the category on screen; from a search, starts with its name
  const handleAddProduct = (inCategoryId: string = categoryId) => {
    router.push({
      pathname: "/(profile)/menu/products/form",
      params: inCategoryId ? { categoryId: inCategoryId } : undefined,
    });
  };

  const openProductActions = (product: Product) => {
    setActionsProduct(product);
    productActionsSheetRef.current?.present();
  };

  /** Closes the actions sheet, then runs what was picked in it. */
  const fromActions = (action: () => void) => () => {
    productActionsSheetRef.current?.dismiss();
    action();
  };

  const getProductActions = (product: Product): ActionsBottomSheetSection[] => {
    const ownStocks = canAdjustStock ? getOwnStocks(product) : [];
    const stockHint = (item: InventoryItem) =>
      item.quantity < 0
        ? tInventory("variant.soldWithoutStock", { count: -item.quantity })
        : tInventory("variant.inStock", { count: item.quantity });

    const stockSection: ActionsBottomSheetSection =
      ownStocks.length === 1
        ? {
            items: [
              {
                icon: "plus",
                label: tInventory("restock"),
                hint: stockHint(ownStocks[0].item),
                onPress: fromActions(() =>
                  setAdjusting({ item: ownStocks[0].item, mode: "restock" }),
                ),
              },
              {
                icon: "minus",
                label: tInventory("decrease"),
                onPress: fromActions(() =>
                  setAdjusting({ item: ownStocks[0].item, mode: "decrease" }),
                ),
              },
            ],
          }
        : {
            // One row per variant; the adjust sheet can still switch to
            // decrease.
            title: tInventory("restock"),
            items: ownStocks.map(({ variantName, item }) => ({
              icon: "plus" as const,
              label: variantName,
              hint: stockHint(item),
              onPress: fromActions(() =>
                setAdjusting({ item, mode: "restock" }),
              ),
            })),
          };

    return [
      stockSection,
      {
        items: [
          {
            icon: "eye",
            label: t("overview.actions.viewProduct"),
            onPress: fromActions(() => openProduct(product)),
          },
          ...(canManage
            ? [
                {
                  icon: "pencil" as const,
                  label: t("products.editProduct"),
                  onPress: fromActions(() => openProductForm(product)),
                },
                {
                  icon: product.isActive
                    ? ("eye-off" as const)
                    : ("eye" as const),
                  label: product.isActive ? t("deactivate") : t("activate"),
                  onPress: fromActions(() =>
                    updateProduct.mutate({
                      id: product.id,
                      isActive: !product.isActive,
                    }),
                  ),
                },
              ]
            : []),
        ],
      },
    ];
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

  const backRow = () => (
    <ThemedView style={tw`px-4 pt-8 bg-transparent`}>
      <InventoryScreenHeader />
    </ThemedView>
  );

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
          setStockFilter(null);
          onChangeSection(created[0].id);
        }}
      />
      <MenuNamesSheet
        sheetRef={categorySheetRef}
        title={t("overview.namesSheet.categoriesTitle")}
        subtitle={t("overview.namesSheet.inSection", {
          section: currentSection?.name ?? "",
        })}
        placeholder={t("overview.namesSheet.categoryPlaceholder")}
        existingNames={categories.map((category) => category.name)}
        createOne={(name) => createCategory.mutateAsync({ name, sectionId })}
        onCreated={(created) => {
          setSearch("");
          setStockFilter(null);
          setSelectedCategoryId(created[0].id);
        }}
      />
    </>
  );

  const stockFilterOptions: (StockFilter | null)[] = [null, "out", "low"];

  const productSheets = (
    <>
      <ThemedBottomSheetModal ref={filterSheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
          <ThemedText type="h3">{t("overview.filter.title")}</ThemedText>
          <ThemedView accessibilityRole="radiogroup" style={tw`bg-transparent`}>
            {stockFilterOptions.map((filter) => {
              const count = filter ? stockCounts[filter] : activeProductCount;
              return (
                <RadioButton
                  key={filter ?? "all"}
                  selected={stockFilter === filter}
                  label={
                    filter
                      ? t(`overview.stock.${filter}`)
                      : t("overview.filter.all")
                  }
                  trailing={
                    <Label
                      text={String(count)}
                      size="small"
                      color={
                        !filter || count === 0
                          ? "default"
                          : filter === "out"
                            ? "error"
                            : "warning"
                      }
                    />
                  }
                  onPress={() => {
                    filterSheetRef.current?.dismiss();
                    setStockFilter(filter);
                  }}
                />
              );
            })}
          </ThemedView>
        </BottomSheetView>
      </ThemedBottomSheetModal>
      <ThemedBottomSheetModal ref={productActionsSheetRef} enablePanDownToClose>
        {actionsProduct && (
          <ActionsBottomSheet
            title={actionsProduct.name}
            subtitle={actionsProduct.category?.name}
            sections={getProductActions(actionsProduct)}
          />
        )}
      </ThemedBottomSheetModal>
      <AdjustStockModal
        item={adjusting?.item ?? null}
        initialMode={adjusting?.mode ?? "restock"}
        onClose={() => setAdjusting(null)}
      />
    </>
  );

  if (!hasMenu && isMenuLoaded && !menuQuery.isError) {
    return (
      <ThemedView style={tw`flex-1 bg-transparent`}>
        {backRow()}
        <ThemedView
          style={tw`flex-1 px-4 items-center justify-center gap-4 bg-transparent`}
        >
          <Icon name="utensils" size={64} color={tw.color("gray-400")} />
          <ThemedView style={tw`gap-2 items-center bg-transparent`}>
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
        </ThemedView>
        {nameSheets}
      </ThemedView>
    );
  }

  if (!hasMenu) {
    return (
      <ThemedView style={tw`flex-1 bg-transparent`}>
        {backRow()}
        <ThemedView
          style={tw`flex-1 px-4 items-center justify-center gap-4 bg-transparent`}
        >
          <Icon name="utensils" size={64} color={tw.color("gray-400")} />
          <ThemedView style={tw`gap-2 items-center bg-transparent`}>
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
      </ThemedView>
    );
  }

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing || isRefetching}
      onRefresh={onRefresh}
      tintColor={primaryColor}
      colors={[primaryColor]}
    />
  );

  const renderProductCard = (product: Product, showCategory = false) => (
    <MenuProductCard
      key={product.id}
      product={product}
      onPress={openProduct}
      onLongPress={openProductActions}
      accessibilityHint={t("overview.longPressForActions")}
      showCategory={showCategory}
      active={isExpanded && selectedProductId === product.id}
    />
  );

  // A section's category rail and its products grouped by category. Only
  // the page on screen tracks the selected category and scroll; neighbours
  // show their top.
  const renderSectionPage = (pageSectionId: string, isActive: boolean) => {
    const pageCategories = isActive
      ? sectionCategories
      : categoriesOfSection(pageSectionId);
    const selected = isActive ? categoryId : pageCategories[0]?.id;
    return (
      <ThemedView style={tw`flex-row gap-3 flex-1 bg-transparent`}>
        <ScrollView
          style={{
            width: CATEGORY_COLUMN_WIDTH,
            flexGrow: 0,
            flexShrink: 0,
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`gap-1 pb-28`}
        >
          {pageCategories.map((category) => {
            const isSelected = selected === category.id;
            return (
              <Pressable
                key={category.id}
                onPress={() => onSelectCategory(category.id)}
                onLongPress={
                  canManage ? () => editCategory(category) : undefined
                }
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityHint={
                  canManage ? t("overview.longPressToEdit") : undefined
                }
                style={({ pressed }) =>
                  tw.style(
                    "flex-row items-center gap-2 px-3 py-2.5 rounded-md",
                    isSelected && "bg-secondary",
                    !category.isActive && "opacity-50",
                    pressed && "opacity-70",
                  )
                }
              >
                <ThemedText
                  type="body2"
                  numberOfLines={2}
                  style={[
                    tw.style(
                      "flex-1",
                      isSelected ? "text-on-secondary" : "text-on-surface",
                    ),
                    {
                      fontFamily: isSelected
                        ? typography.bold
                        : typography.medium,
                    },
                  ]}
                >
                  {category.name}
                </ThemedText>
                <ThemedText
                  type="small"
                  style={[tw`text-gray-500`, { fontVariant: ["tabular-nums"] }]}
                >
                  {productsByCategory.get(category.id)?.length ?? 0}
                </ThemedText>
              </Pressable>
            );
          })}
          {canManage && (
            <Pressable
              onPress={handleAddCategory}
              accessibilityRole="button"
              accessibilityLabel={t("categories.newCategory")}
              style={({ pressed }) =>
                tw.style(
                  "flex-row items-center gap-2 px-3 py-2.5 rounded-md",
                  pressed && "opacity-70",
                )
              }
            >
              <Icon name="plus" size={16} />
              <ThemedText type="body2" style={tw`text-gray-500`}>
                {t("overview.add")}
              </ThemedText>
            </Pressable>
          )}
        </ScrollView>
        <ScrollView
          ref={isActive ? productsScrollRef : undefined}
          style={tw`flex-1`}
          onLayout={(e) => {
            if (isActive) productsHeight.current = e.nativeEvent.layout.height;
          }}
          onScroll={isActive ? onProductsScroll : undefined}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`gap-6 pb-28`}
          refreshControl={refreshControl}
        >
          {pageCategories.length === 0 && (
            <ProductsEmpty
              icon="layout-list"
              title={t("overview.emptySection")}
              actionLabel={canManage ? t("categories.newCategory") : undefined}
              onAction={handleAddCategory}
            />
          )}
          {pageCategories.map((category) => {
            const categoryProducts = productsByCategory.get(category.id) ?? [];
            return (
              <View
                key={category.id}
                style={tw`gap-2`}
                onLayout={(e) => {
                  if (isActive) {
                    categoryGroupY.current.set(
                      category.id,
                      e.nativeEvent.layout.y,
                    );
                  }
                }}
              >
                <ThemedView
                  style={tw`flex-row items-center gap-2 bg-transparent`}
                >
                  <ThemedText
                    type="h4"
                    numberOfLines={1}
                    style={tw.style(
                      "flex-shrink",
                      !category.isActive && "text-gray-500",
                    )}
                  >
                    {category.name}
                  </ThemedText>
                  {!category.isActive && (
                    <Label text={t("inactive")} size="small" />
                  )}
                </ThemedView>
                {categoryProducts.length > 0 ? (
                  categoryProducts.map((product) => renderProductCard(product))
                ) : (
                  <ThemedView style={tw`items-start gap-3 bg-transparent`}>
                    <ThemedText type="body2" style={tw`text-gray-500`}>
                      {t("overview.emptyCategory")}
                    </ThemedText>
                    {canManage && (
                      <Button
                        label={t("products.newProduct")}
                        leftIcon="plus"
                        variant="outline"
                        size="small"
                        onPress={() => handleAddProduct(category.id)}
                      />
                    )}
                  </ThemedView>
                )}
              </View>
            );
          })}
        </ScrollView>
      </ThemedView>
    );
  };

  const filterLabel = stockFilter
    ? t(`overview.stock.${stockFilter}`)
    : undefined;

  const filteredList = (
    <ScrollView
      style={tw`flex-1`}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={tw`gap-2 pb-28`}
      refreshControl={refreshControl}
    >
      {filteredProducts.length === 0 ? (
        <ProductsEmpty
          icon={hasSearch ? "search-x" : "circle-check"}
          title={
            hasSearch
              ? t("products.noSearchResults", { query: search.trim() })
              : t(`overview.filter.empty.${stockFilter}`)
          }
          actionLabel={
            hasSearch ? t("overview.search.clear") : t("overview.filter.clear")
          }
          onAction={() => (hasSearch ? setSearch("") : setStockFilter(null))}
        />
      ) : (
        <>
          <ThemedView
            style={tw`flex-row items-center justify-between gap-2 min-h-12 bg-transparent`}
          >
            <ThemedText
              type="body2"
              style={tw`flex-1 text-gray-500`}
              numberOfLines={1}
            >
              {[
                filterLabel,
                t("overview.filter.results", {
                  count: filteredProducts.length,
                }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </ThemedText>
            {/* A search clears from its own field */}
            {stockFilter && (
              <Button
                label={t("overview.filter.clear")}
                variant="link"
                size="small"
                leftIcon="x"
                onPress={() => setStockFilter(null)}
              />
            )}
          </ThemedView>
          {/* Results span categories: say where each one is */}
          {filteredProducts.map((product) => renderProductCard(product, true))}
        </>
      )}
    </ScrollView>
  );

  const menu = (
    <ThemedView style={tw`flex-1 bg-transparent`}>
      {backRow()}
      <ThemedView style={tw`flex-1 px-4 pt-6 gap-4 bg-transparent`}>
        <DetailHeader
          title={t("overview.title")}
          subtitle={
            isLoading
              ? t("loading")
              : t("overview.filter.results", { count: activeProductCount })
          }
        />

        {products.length > 0 && (
          <ThemedView style={tw`flex-row items-center gap-4 bg-transparent`}>
            <ThemedView style={tw`flex-1 bg-transparent`}>
              <TextInput
                value={search}
                placeholder={t("products.searchPlaceholder")}
                onChangeText={setSearch}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                icon="search"
                containerStyle={tw`rounded-full`}
                returnKeyType="search"
                autoCorrect={false}
                trailingIcon={
                  search ? (
                    <IconButton
                      icon="circle-x"
                      accessibilityLabel={t("overview.search.clear")}
                      onPress={() => setSearch("")}
                    />
                  ) : null
                }
              />
            </ThemedView>
            {/* The wash says a filter is on; the results line names it */}
            <IconButton
              icon="list-filter"
              variant={stockFilter ? "secondary" : "text"}
              size={20}
              accessibilityLabel={t("overview.filter.open")}
              onPress={() => filterSheetRef.current?.present()}
            />
          </ThemedView>
        )}

        {isLoading && sections.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3 bg-transparent`}>
            <Icon name="utensils" size={48} color={tw.color("gray-400")} />
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {t("loading")}
            </ThemedText>
          </ThemedView>
        )}

        {isError && sections.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3 bg-transparent`}>
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

        {isFiltering ? (
          filteredList
        ) : sortedSections.length > 0 ? (
          <>
            <ThemedView style={tw`gap-2 bg-transparent`}>
              <SectionTabBar
                tabs={sectionTabs}
                activeTab={sectionId}
                onChange={onChangeSection}
                activeTrailing={
                  canManage &&
                  currentSection && (
                    <Pressable
                      onPress={() => editSection(currentSection)}
                      hitSlop={12}
                      accessibilityRole="button"
                      accessibilityLabel={t("overview.editSection", {
                        name: currentSection.name,
                      })}
                      style={({ pressed }) => tw.style(pressed && "opacity-70")}
                    >
                      <Icon name="pencil" size={16} />
                    </Pressable>
                  )
                }
                trailing={
                  canManage && (
                    <Pressable
                      onPress={handleAddSection}
                      hitSlop={8}
                      accessibilityRole="button"
                      style={({ pressed }) =>
                        tw.style(
                          "flex-row items-center py-2 px-1 gap-1",
                          pressed && "opacity-70",
                        )
                      }
                    >
                      <Icon
                        name="plus"
                        size={18}
                        color={tw.color("gray-500")}
                      />
                      <ThemedText
                        type="h4"
                        numberOfLines={1}
                        style={[
                          tw`text-gray-500`,
                          { fontFamily: typography.medium },
                        ]}
                      >
                        {t("sections.newSection")}
                      </ThemedText>
                    </Pressable>
                  )
                }
              />
              {currentSection && !currentSection.isActive && (
                // What being inactive means here, and the way back
                <ThemedView
                  style={tw`flex-row items-center gap-2 min-h-12 bg-transparent`}
                >
                  <ThemedText
                    type="body2"
                    style={tw`flex-1 text-gray-500`}
                    numberOfLines={2}
                  >
                    {t("overview.sectionInactive")}
                  </ThemedText>
                  {canManage && (
                    <Button
                      label={t("activate")}
                      leftIcon="eye"
                      variant="link"
                      size="small"
                      loading={updateSection.isPending}
                      disabled={updateSection.isPending}
                      onPress={() =>
                        updateSection.mutate({
                          id: currentSection.id,
                          isActive: true,
                        })
                      }
                    />
                  )}
                </ThemedView>
              )}
            </ThemedView>
            {/* One page per section: drag left/right and the next section
                comes in under the finger. Only the section on screen and
                its neighbours are rendered. */}
            <TabPager
              tabs={sectionTabs}
              activeTab={sectionId}
              onChange={onChangeSection}
              keepVisited={false}
              renderScene={renderSectionPage}
            />
          </>
        ) : null}
      </ThemedView>

      {/* Hidden while typing a search so it doesn't ride on the keyboard */}
      {canManage && !isSearchFocused && (
        <View
          pointerEvents="box-none"
          style={tw`absolute left-0 right-0 bottom-0 items-center px-4 pb-4`}
        >
          <Button
            label={t("products.newProduct")}
            leftIcon="plus"
            shape="rounded"
            style={tw`shadow-lg`}
            onPress={() => handleAddProduct()}
          />
        </View>
      )}

      {nameSheets}
      {productSheets}
    </ThemedView>
  );

  if (!isExpanded) return menu;

  return (
    <InventorySplitLayout
      list={menu}
      emptyIcon="hamburger"
      emptyText={t("overview.pane.emptyTitle")}
      pane={
        selectedProductId ? (
          <MenuProductDetailView
            key={selectedProductId}
            productId={selectedProductId}
            embedded
            onClose={() => setSelectedProductId(null)}
            onOpenProduct={setSelectedProductId}
          />
        ) : null
      }
    />
  );
}

/** No products to show: an empty section, a search miss or a clear filter. */
function ProductsEmpty({
  icon,
  title,
  actionLabel,
  onAction,
}: {
  icon: "search-x" | "circle-check" | "layout-list";
  title: string;
  actionLabel?: string;
  onAction: () => void;
}) {
  return (
    <ThemedView style={tw`items-center py-8 gap-3 bg-transparent`}>
      <Icon name={icon} size={40} color={tw.color("gray-400")} />
      <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
        {title}
      </ThemedText>
      {actionLabel && (
        <Button
          label={actionLabel}
          variant="outline"
          size="small"
          onPress={onAction}
        />
      )}
    </ThemedView>
  );
}
