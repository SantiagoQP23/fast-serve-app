import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, RefreshControl, ScrollView } from "react-native";
// Wins over the Productos tab pager, so the section chips scroll sideways.
import { ScrollView as GestureScrollView } from "react-native-gesture-handler";
import { router, useFocusEffect } from "expo-router";
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
import Label from "@/presentation/theme/components/label";
import ActionsBottomSheet, {
  type ActionsBottomSheetSection,
} from "@/presentation/theme/components/actions-bottom-sheet";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import AdjustStockModal from "@/presentation/inventory/components/adjust-stock-modal";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useProductSearch } from "@/presentation/restaurant-menu/hooks/useProductSearch";
import { useMenuManagement } from "@/presentation/menu-management/hooks/useMenuManagement";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import {
  canManageInventory,
  isAdminLevelRole,
} from "@/core/auth/models/user.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
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
import ProductVariantList from "@/presentation/menu-management/components/product-variant-list";
import MenuProductDetailView from "@/presentation/menu-management/components/menu-product-detail-view";
import MenuNamesSheet from "@/presentation/menu-management/components/menu-names-sheet";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { openProductForm } from "@/presentation/menu-management/utils/open-product-form";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";

const PRODUCT_PANE_WIDTH = 600;

interface MenuOverviewContentProps {
  /**
   * Shown as a page of the Productos tab: no screen layout of its own and
   * less top padding, since the tab already has a header.
   */
  embedded?: boolean;
  /** Embedded: whether the Menú page is the one showing (Back clears it). */
  active?: boolean;
  /**
   * Embedded: the search field opens from the tab header's search button.
   * Standalone, the field is always there.
   */
  searchOpen?: boolean;
  onSearchOpenChange?: (open: boolean) => void;
}

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
 * stock. Used by the Productos tab's Menú page and the menu overview
 * screen.
 */
export default function MenuOverviewContent({
  embedded = false,
  active = true,
  searchOpen = false,
  onSearchOpenChange,
}: MenuOverviewContentProps) {
  const { t } = useTranslation("menuManagement");
  const { t: tInventory } = useTranslation("inventory");
  const primaryColor = useThemeColor({}, "primary");
  const { sections, categories, products, menuQuery } = useMenu();
  const { isLoading, isError, refetch, isRefetching } = menuQuery;
  const { createSection, createCategory, updateProduct } = useMenuManagement();
  const { user, currentRestaurant } = useAuthStore();
  const menuRestaurantId = useMenuStore((state) => state.restaurantId);
  const canManage = isAdminLevelRole(user?.role?.name);
  const canAdjustStock = canManageInventory(user?.role?.name);

  const [sectionId, setSectionId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter | null>(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const sectionSheetRef = useRef<BottomSheetMethods>(null);
  const categorySheetRef = useRef<BottomSheetMethods>(null);
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

  const sortedSections = useMemo(
    () => sections.slice().sort((a, b) => a.order - b.order),
    [sections],
  );

  const sectionCategories = useMemo(
    () => categories.filter((category) => category.sectionId === sectionId),
    [categories, sectionId],
  );

  const productCountByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      const id = product.category?.id;
      if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, [products]);

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
    // Land on a category with products rather than an empty one
    const firstWithProducts = sectionCategories.find((category) =>
      productCountByCategory.get(category.id),
    );
    setCategoryId((firstWithProducts ?? sectionCategories[0])?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId, sectionCategories]);

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

  const matchesStockFilter = useCallback(
    (product: Product) => {
      if (!stockFilter || !product.isActive) return !stockFilter;
      const summary = stockSummaries.get(product.id);
      return !!summary && getProductStockAttention(summary) === stockFilter;
    },
    [stockFilter, stockSummaries],
  );

  // A search or a stock filter spans the whole menu, not one category.
  const isFiltering = !!search.trim() || !!stockFilter;
  const showSearch = !embedded || searchOpen;

  const clearFilters = useCallback(() => {
    setSearch("");
    setStockFilter(null);
    onSearchOpenChange?.(false);
  }, [onSearchOpenChange]);

  // Back leaves a search or stock filter before it leaves the screen
  const hasBackStep = active && (isFiltering || (embedded && searchOpen));
  useFocusEffect(
    useCallback(() => {
      if (!hasBackStep) return;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          clearFilters();
          return true;
        },
      );
      return () => subscription.remove();
    }, [hasBackStep, clearFilters]),
  );
  const searchResults = useProductSearch(products, search);
  const filteredProducts = useMemo(() => {
    if (isFiltering)
      return (search.trim() ? searchResults : products).filter(
        matchesStockFilter,
      );
    return products.filter((product) => product.category.id === categoryId);
  }, [
    products,
    search,
    searchResults,
    categoryId,
    isFiltering,
    matchesStockFilter,
  ]);

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

  const handleAddProduct = () => {
    router.push({
      pathname: "/(profile)/menu/products/form",
      params: categoryId ? { categoryId } : undefined,
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

  const productSheets = (
    <>
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

  const filterLabel = stockFilter
    ? t(`overview.stock.${stockFilter}`)
    : undefined;

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

  const menuBody = (
    <>
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

      {showSearch && (
        <TextInput
          value={search}
          placeholder={t("products.searchPlaceholder")}
          onChangeText={setSearch}
          icon="search"
          autoFocus={embedded}
          returnKeyType="search"
          trailingIcon={
            search || embedded ? (
              <IconButton
                icon={embedded ? "x" : "circle-x"}
                accessibilityLabel={
                  embedded
                    ? t("overview.search.close")
                    : t("overview.search.clear")
                }
                onPress={() =>
                  embedded && !search
                    ? onSearchOpenChange?.(false)
                    : setSearch("")
                }
              />
            ) : null
          }
        />
      )}

      {products.length > 0 && (
        <GestureScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={tw`flex-grow-0`}
          contentContainerStyle={tw`gap-2`}
        >
          {(["out", "low"] as const).map((filter) => {
            const count = stockCounts[filter];
            return (
              <Chip
                key={filter}
                label={t(`overview.stock.${filter}`)}
                selected={stockFilter === filter}
                onPress={() =>
                  setStockFilter((current) =>
                    current === filter ? null : filter,
                  )
                }
                rightContent={
                  <Label
                    text={String(count)}
                    size="small"
                    color={
                      count === 0
                        ? "default"
                        : filter === "out"
                          ? "error"
                          : "warning"
                    }
                  />
                }
              />
            );
          })}
        </GestureScrollView>
      )}

      {isFiltering ? (
        // Without results the empty state says it and offers the way out
        filteredProducts.length > 0 && (
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
        )
      ) : (
        <GestureScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={tw`flex-grow-0`}
          contentContainerStyle={tw`gap-2`}
        >
          {sortedSections.map((section) => (
            <ThemedView
              style={!section.isActive && tw`opacity-50`}
              key={section.id}
            >
              <Chip
                label={section.name}
                selected={sectionId === section.id}
                onPress={() => setSectionId(section.id)}
                onLongPress={canManage ? () => editSection(section) : undefined}
                accessibilityHint={
                  canManage ? t("overview.longPressToEdit") : undefined
                }
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
        </GestureScrollView>
      )}

      <ThemedView style={tw`flex-row gap-3 flex-1 bg-transparent`}>
        {!isFiltering && (
          <ThemedView style={tw`w-32 flex-shrink-0`}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={tw`gap-2 pb-8`}
            >
              {sectionCategories.map((category) => (
                <ThemedView
                  key={category.id}
                  style={!category.isActive && tw`opacity-50`}
                >
                  <Chip
                    label={category.name}
                    selected={categoryId === category.id}
                    showSelectedCheck={false}
                    onPress={() => setCategoryId(category.id)}
                    onLongPress={
                      canManage ? () => editCategory(category) : undefined
                    }
                    accessibilityHint={
                      canManage ? t("overview.longPressToEdit") : undefined
                    }
                    rightContent={
                      <ThemedText
                        type="small"
                        style={[
                          tw`text-gray-500 ml-auto`,
                          { fontVariant: ["tabular-nums"] },
                        ]}
                      >
                        {productCountByCategory.get(category.id) ?? 0}
                      </ThemedText>
                    }
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
        <ScrollView
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={tw`gap-2 pb-8`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || isRefetching}
              onRefresh={onRefresh}
              tintColor={primaryColor}
              colors={[primaryColor]}
            />
          }
        >
          {canManage && !isFiltering && (
            <Button
              label={t("products.newProduct")}
              leftIcon="plus"
              variant="outline"
              onPress={handleAddProduct}
            />
          )}
          {filteredProducts.length === 0 && (
            <ProductsEmpty
              icon={
                stockFilter && !search.trim() ? "circle-check" : "hamburger"
              }
              title={
                search.trim()
                  ? t("products.noSearchResults", { query: search.trim() })
                  : stockFilter
                    ? t(`overview.filter.empty.${stockFilter}`)
                    : t("overview.emptyCategory")
              }
              actionLabel={
                isFiltering
                  ? search.trim()
                    ? t("overview.search.clear")
                    : t("overview.filter.clear")
                  : undefined
              }
              onAction={() =>
                search.trim() ? setSearch("") : setStockFilter(null)
              }
            />
          )}
          {filteredProducts.map((product) => {
            return (
              <Card
                key={product.id}
                onPress={() => openProduct(product)}
                onLongPress={() => openProductActions(product)}
                accessibilityHint={t("overview.longPressForActions")}
                style={tw.style(
                  "px-4 py-3",
                  isExpanded &&
                    selectedProductId === product.id &&
                    "bg-secondary",
                )}
              >
                <ThemedView style={tw`gap-2 bg-transparent`}>
                  <ThemedView
                    style={tw`flex-row items-center gap-2 bg-transparent`}
                  >
                    <ThemedText
                      type="body1"
                      style={tw.style(
                        "flex-1",
                        !product.isActive && "text-gray-500",
                      )}
                      numberOfLines={2}
                    >
                      {product.name}
                    </ThemedText>
                    {!product.isActive && (
                      <Label text={t("inactive")} size="small" />
                    )}
                  </ThemedView>
                  {/* Results span categories: say where each one is */}
                  {isFiltering && (
                    <ThemedText
                      type="small"
                      style={tw`-mt-1.5 text-gray-500`}
                      numberOfLines={1}
                    >
                      {product.category?.name}
                    </ThemedText>
                  )}
                  <ProductVariantList product={product} />
                </ThemedView>
              </Card>
            );
          })}
        </ScrollView>
      </ThemedView>

      {nameSheets}
      {productSheets}
    </>
  );

  const menu = embedded ? (
    <ThemedView style={tw`px-4 pt-4 flex-1 gap-4 bg-transparent`}>
      {menuBody}
    </ThemedView>
  ) : (
    <ScreenLayout fullWidth={isExpanded} style={tw`px-4 pt-2 flex-1 gap-4`}>
      {menuBody}
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

/** No products to show: an empty category, a search miss or a clear filter. */
function ProductsEmpty({
  icon,
  title,
  actionLabel,
  onAction,
}: {
  icon: "hamburger" | "circle-check";
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
