import { Keyboard, RefreshControl, ScrollView } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import ProductCard from "@/presentation/restaurant-menu/product-card";
import { useCallback, useEffect, useMemo, useState } from "react";
import Chip from "@/presentation/theme/components/chip";
import SegmentedControl from "@/presentation/theme/components/segmented-control";
import { useRouter } from "expo-router";
import FloatingSearchBar from "@/presentation/theme/components/floating-search-bar";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useProductSearch } from "@/presentation/restaurant-menu/hooks/useProductSearch";
import { useSyncRefresh } from "@/presentation/sync/hooks/useSyncRefresh";
import { Category } from "@/core/menu/models/category.model";
import { Product } from "@/core/menu/models/product.model";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import Button from "@/presentation/theme/components/button";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useEditOrderCartStore } from "@/presentation/orders/store/editOrderCartStore";
import { useReplaceOrderDetailStore } from "@/presentation/orders/store/replaceOrderDetailStore";
import { useEditSaleStore } from "@/presentation/orders/store/editSaleStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";
import CartPanel from "@/presentation/orders/components/cart-panel";

const PRODUCT_MIN_WIDTH = 200;
const PRODUCT_GAP = 12;
const CART_PANEL_WIDTH = 400;
const CATEGORY_COLUMN_WIDTH = 200;

export default function RestaurantMenuScreen() {
  const { t } = useTranslation(["menu", "orders"]);
  const primaryColor = useThemeColor({}, "primary");
  const [section, setSection] = useState("");
  const [category, setCategory] = useState("");
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const {
    categories: allCategories,
    sections: allSections,
    products: allProducts,
    menuQuery,
  } = useMenu();
  const refreshSync = useSyncRefresh();
  const sections = useMemo(
    () => allSections.filter((s) => s.isActive),
    [allSections],
  );
  const categories = useMemo(
    () => allCategories.filter((c) => c.isActive),
    [allCategories],
  );
  const products = useMemo(
    () => allProducts.filter((p) => p.isActive),
    [allProducts],
  );
  const searchResults = useProductSearch(products, search);
  const filteredProducts = useMemo(
    () =>
      search.trim()
        ? searchResults
        : products.filter((p) => p.category.id === category),
    [search, searchResults, products, category],
  );
  const { setActiveProduct } = useMenuStore();
  const details = useNewOrderStore((state) => state.details);
  // Editing a direct sale: products are added to it, not to an order or cart.
  const isSaleEditMode = useEditSaleStore((state) => state.billId !== null);
  const saleBillNum = useEditSaleStore((state) => state.billNum);
  const newSaleLineCount = useEditSaleStore(
    (state) => state.lines.filter((line) => !line.billDetailId).length,
  );
  const activeOrder = useOrdersStore((state) => state.activeOrder);
  const order = isSaleEditMode ? null : activeOrder;
  const editOrderId = useEditOrderCartStore((state) => state.orderId);
  const newItemCount = useEditOrderCartStore((state) =>
    state.getNewItemCount(),
  );
  const initEditCart = useEditOrderCartStore((state) => state.init);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isEditMode = !!order && editOrderId === order.id;

  const replaceOrderId = useReplaceOrderDetailStore((state) => state.orderId);
  const replacingDetail = useReplaceOrderDetailStore((state) => state.detail);
  const resetReplace = useReplaceOrderDetailStore((state) => state.reset);
  const isReplaceMode =
    !!order && !!replacingDetail && replaceOrderId === order.id;

  // Leaving the menu ends replace mode, however the user leaves it.
  useEffect(() => resetReplace, [resetReplace]);

  // Tablet landscape: cart lives in a side pane next to the menu
  const { isExpanded, gridColumns } = useResponsiveLayout();
  const showCartPanel = isExpanded && !isReplaceMode && !isSaleEditMode;

  // Products flow into as many columns as fit the measured list width
  const [productsWidth, setProductsWidth] = useState(0);
  const productColumns = gridColumns(
    PRODUCT_MIN_WIDTH,
    PRODUCT_GAP,
    productsWidth,
  );
  const productWidth =
    productsWidth > 0
      ? (productsWidth - PRODUCT_GAP * (productColumns - 1)) / productColumns
      : undefined;

  useEffect(() => {
    if (order && !editOrderId) {
      initEditCart(order);
    }
  }, [order, editOrderId, initEditCart]);

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
      await refreshSync();
    } finally {
      setRefreshing(false);
    }
  }, [refreshSync]);

  const openProduct = (product: Product) => {
    Keyboard.dismiss();
    setActiveProduct(product);
    router.push("/(new-order)/restaurant-menu/product");
  };

  const onChangeCategory = useCallback((value: string) => {
    setCategory(value);
  }, []);

  const onChangeSection = useCallback(
    (value: string) => {
      setSection(value);
      setFilteredCategories(() => {
        const newCategories = categories.filter((c) => c.sectionId === value);
        if (newCategories.length > 0) onChangeCategory(newCategories[0].id);
        else onChangeCategory("");
        return newCategories;
      });
    },
    [categories, onChangeCategory],
  );

  useEffect(() => {
    if (sections.length > 0 && !section) {
      onChangeSection(sections[0].id);
    }
  }, [sections, section, onChangeSection]);

  useEffect(() => {
    if (!section) return;
    setFilteredCategories(categories.filter((c) => c.sectionId === section));
  }, [categories, section]);

  useEffect(() => {
    if (filteredCategories.length > 0 && !category) {
      onChangeCategory(filteredCategories[0].id);
    }
  }, [filteredCategories, category, onChangeCategory]);

  // Check if menu is loaded
  const hasMenu =
    sections.length > 0 || categories.length > 0 || products.length > 0;

  // Show empty state if no menu loaded
  if (!hasMenu) {
    return (
      <ThemedView
        style={tw`flex-1 px-4 pt-8 items-center justify-center gap-4`}
      >
        <Ionicons
          name="restaurant-outline"
          size={64}
          color={tw.color("gray-400")}
        />
        <ThemedView style={tw`gap-2 items-center`}>
          <ThemedText type="h2">{t("menu:noMenu.title")}</ThemedText>
          <ThemedText type="body2" style={tw`text-center text-gray-500 px-8`}>
            {t("menu:noMenu.description")}
          </ThemedText>
        </ThemedView>
        <Button
          label={
            menuQuery.isError
              ? t("menu:noMenu.retry")
              : isLoadingMenu
                ? t("menu:noMenu.loading")
                : t("menu:noMenu.loadButton")
          }
          leftIcon="cloud-download-outline"
          onPress={handleLoadMenu}
          disabled={isLoadingMenu}
          loading={isLoadingMenu}
        />
        {menuQuery.isError && (
          <ThemedText type="body2" style={tw`text-red-500 text-center px-8`}>
            {t("menu:noMenu.error")}
          </ThemedText>
        )}
      </ThemedView>
    );
  }

  const menu = (
    <ScreenLayout fullWidth style={tw`px-4 pt-2 flex-1 gap-4`}>
      {isSaleEditMode && (
        <ThemedView
          style={tw`flex-row items-center gap-3 p-3 rounded-xl bg-gray-100`}
        >
          <Ionicons
            name="receipt-outline"
            size={20}
            color={tw.color("gray-700")}
          />
          <ThemedText type="body2" style={tw`flex-1`}>
            {t("bills:editSale.menuBanner", { number: saleBillNum })}
          </ThemedText>
        </ThemedView>
      )}
      {isReplaceMode && (
        <ThemedView
          style={tw`flex-row items-center gap-3 p-3 rounded-xl bg-gray-100`}
        >
          <Ionicons
            name="swap-horizontal-outline"
            size={20}
            color={tw.color("gray-700")}
          />
          <ThemedText type="body2" style={tw`flex-1`}>
            {t("orders:replaceItem.banner", {
              quantity: replacingDetail.quantity,
              product: replacingDetail.product.name,
            })}
          </ThemedText>
        </ThemedView>
      )}
      {!search && (
        <ThemedView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <SegmentedControl
              variant="text"
              textType="body1"
              items={sections.map((s) => ({ label: s.name, value: s.id }))}
              value={section}
              onChange={onChangeSection}
            />
          </ScrollView>
        </ThemedView>
      )}
      <ThemedView style={tw`flex-row gap-2 flex-1`}>
        {!search && (
          <ScrollView
            style={
              isExpanded
                ? { width: CATEGORY_COLUMN_WIDTH, flexGrow: 0 }
                : tw`w-30 flex-shrink-0`
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={tw`gap-2`}
          >
            {filteredCategories.map((f) => (
              <Chip
                key={f.id}
                label={f.name}
                selected={category === f.id}
                onPress={() => onChangeCategory(f.id)}
              />
            ))}
          </ScrollView>
        )}
        <ScrollView
          style={tw`${search || isExpanded ? "flex-1" : "w-[70%] flex-shrink-0"}`}
          onLayout={(e) => setProductsWidth(e.nativeEvent.layout.width)}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[
            tw`flex-row flex-wrap pb-40`,
            { gap: PRODUCT_GAP },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={primaryColor}
              colors={[primaryColor]}
            />
          }
        >
          {filteredProducts.map((product) => (
            <ThemedView
              key={product.id}
              style={productWidth ? { width: productWidth } : tw`w-full`}
            >
              <ProductCard
                onPress={() => openProduct(product)}
                product={product}
              ></ProductCard>
            </ThemedView>
          ))}
        </ScrollView>
      </ThemedView>

      <FloatingSearchBar
        value={search}
        onChangeText={setSearch}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => setIsSearchFocused(false)}
        placeholder={t("menu:searchPlaceholder")}
      >
        {/* Hidden while searching so it doesn't crowd the keyboard, and
            when the cart is already visible in the side pane. */}
        {!isSearchFocused && isSaleEditMode && newSaleLineCount > 0 && (
          <ThemedView
            style={tw`flex-row justify-end items-center bg-transparent`}
          >
            <Button
              label={t("bills:editSale.backToSale", {
                count: newSaleLineCount,
              })}
              leftIcon="receipt-outline"
              onPress={() => router.back()}
            />
          </ThemedView>
        )}

        {!showCartPanel &&
          !isSearchFocused &&
          !order &&
          !isSaleEditMode &&
          details.length > 0 && (
            <ThemedView
              style={tw`flex-row justify-end items-center bg-transparent`}
            >
              <Button
                label={t("menu:goToCart")}
                leftIcon="cart-outline"
                onPress={() => router.push("/(new-order)/cart")}
              />
            </ThemedView>
          )}

        {!showCartPanel &&
          !isSearchFocused &&
          isEditMode &&
          !isReplaceMode &&
          newItemCount > 0 && (
            <ThemedView
              style={tw`flex-row justify-end items-center bg-transparent gap-2`}
            >
              <ThemedView
                style={tw`bg-primary-600 rounded-full w-8 h-8 items-center justify-center`}
              >
                <ThemedText style={tw`text-white font-bold text-sm`}>
                  {newItemCount}
                </ThemedText>
              </ThemedView>
              <Button
                label={t("menu:goToCart")}
                leftIcon="cart-outline"
                onPress={() => router.push("/(new-order)/cart")}
              />
            </ThemedView>
          )}
      </FloatingSearchBar>
    </ScreenLayout>
  );

  if (!showCartPanel) return menu;

  return (
    <ThemedView style={tw`flex-1 flex-row bg-background`}>
      <ThemedView style={tw`flex-1`}>{menu}</ThemedView>
      <ThemedView
        style={[
          tw`border-l border-outline-variant`,
          { width: CART_PANEL_WIDTH },
        ]}
      >
        <CartPanel embedded />
      </ThemedView>
    </ThemedView>
  );
}
