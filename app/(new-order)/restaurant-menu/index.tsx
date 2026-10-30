import {
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import ProductRow from "@/presentation/restaurant-menu/product-row";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TabBar from "@/presentation/theme/components/tab-bar";
import TabPager from "@/presentation/theme/components/tab-pager";
import { useRouter } from "expo-router";
import TextInput from "@/presentation/theme/components/text-input";
import IconButton from "@/presentation/theme/components/icon-button";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useProductSearch } from "@/presentation/restaurant-menu/hooks/useProductSearch";
import { useSyncRefresh } from "@/presentation/sync/hooks/useSyncRefresh";
import { Product } from "@/core/menu/models/product.model";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import Button from "@/presentation/theme/components/button";
import { useEditOrderCartStore } from "@/presentation/orders/store/editOrderCartStore";
import { useReplaceOrderDetailStore } from "@/presentation/orders/store/replaceOrderDetailStore";
import { useEditSaleStore } from "@/presentation/orders/store/editSaleStore";
import { useMenuCart } from "@/presentation/restaurant-menu/hooks/useMenuCart";
import MenuCartBar from "@/presentation/restaurant-menu/components/menu-cart-bar";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import Icon from "@/presentation/theme/components/icon";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";
import CartPanel from "@/presentation/orders/components/cart-panel";
import { typography } from "@/constants/theme";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { NewOrderDetail } from "@/core/orders/dto/new-order-detail.dto";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { type BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import ActionsBottomSheet from "@/presentation/theme/components/actions-bottom-sheet";

const PRODUCT_MIN_WIDTH = 200;
const PRODUCT_GAP = 12;
const CART_PANEL_WIDTH = 400;
const CATEGORY_COLUMN_WIDTH = 200;
const CATEGORY_COLUMN_WIDTH_COMPACT = 136;
// A group becomes "current" once its header passes this share of the list.
const CATEGORY_SPY_RATIO = 0.3;
// Ignore scroll-spy while a tap-triggered scroll animates to its group.
const CATEGORY_SCROLL_LOCK_MS = 600;
// After a section change, once the old section has slid off screen
const SECTION_RESET_DELAY_MS = 300;

export default function RestaurantMenuScreen() {
  const { t } = useTranslation(["menu", "orders", "bills", "common"]);
  const primaryColor = useThemeColor({}, "primary");
  const [selectedSection, setSection] = useState("");
  const [selectedCategory, setCategory] = useState("");
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
  const sectionTabs = useMemo(
    () => sections.map((s) => ({ label: s.name, value: s.id })),
    [sections],
  );
  const categories = useMemo(
    () => allCategories.filter((c) => c.isActive),
    [allCategories],
  );
  const products = useMemo(
    () => allProducts.filter((p) => p.isActive),
    [allProducts],
  );
  const isSearching = search.trim() !== "";
  const searchResults = useProductSearch(products, search);
  const productsByCategory = useMemo(() => {
    const byCategory = new Map<string, Product[]>();
    for (const product of products) {
      const list = byCategory.get(product.category.id);
      if (list) list.push(product);
      else byCategory.set(product.category.id, [product]);
    }
    return byCategory;
  }, [products]);
  const section = selectedSection || sections[0]?.id || "";
  // Categories of the current section that have something to show.
  const categoriesOfSection = (sectionId: string) =>
    categories.filter(
      (c) => c.sectionId === sectionId && productsByCategory.has(c.id),
    );
  const sectionCategories = useMemo(
    () =>
      categories.filter(
        (c) => c.sectionId === section && productsByCategory.has(c.id),
      ),
    [categories, section, productsByCategory],
  );
  const category = sectionCategories.some((c) => c.id === selectedCategory)
    ? selectedCategory
    : (sectionCategories[0]?.id ?? "");
  const { setActiveProduct } = useMenuStore();
  const setActiveDetail = useNewOrderStore((state) => state.setActiveDetail);
  // Where picked products go (cart, order being edited, sale being edited…)
  const cart = useMenuCart();
  const { order } = cart;
  const isSaleEditMode = cart.mode === "sale";
  const isReplaceMode = cart.mode === "replace";
  const saleBillNum = useEditSaleStore((state) => state.billNum);
  const editOrderId = useEditOrderCartStore((state) => state.orderId);
  const initEditCart = useEditOrderCartStore((state) => state.init);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const replacingDetail = useReplaceOrderDetailStore((state) => state.detail);
  const resetReplace = useReplaceOrderDetailStore((state) => state.reset);

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

  const editLine = (detail: NewOrderDetail) => {
    Keyboard.dismiss();
    setActiveDetail(detail);
    setActiveProduct(detail.product);
    router.push("/(new-order)/restaurant-menu/product");
  };

  // Tapping the count edits the product's cart line, asking which one first
  // when it's in the cart more than once (another variant, note or type).
  const lineSheetRef = useRef<BottomSheetMethods>(null);
  const [lineSheetProductId, setLineSheetProductId] = useState<string | null>(
    null,
  );
  const lineSheetLines = lineSheetProductId
    ? cart.editableLines(lineSheetProductId)
    : [];
  useEffect(() => {
    if (lineSheetProductId) lineSheetRef.current?.present();
  }, [lineSheetProductId]);
  const onPressCount = (product: Product) => {
    const lines = cart.editableLines(product.id);
    if (lines.length === 1) {
      editLine(lines[0]);
    } else if (lines.length > 1) {
      Keyboard.dismiss();
      setLineSheetProductId(product.id);
    }
  };
  const describeLine = (detail: NewOrderDetail) => {
    const hasVariants =
      detail.product.options.filter((option) => option.isActive).length > 1;
    return [
      `${detail.quantity} × ${
        hasVariants && detail.productOption
          ? detail.productOption.name
          : detail.product.name
      }`,
      detail.typeOrderDetail !== cart.defaultOrderType &&
        (detail.typeOrderDetail === OrderType.IN_PLACE
          ? t("common:orderType.inPlace")
          : t("common:orderType.takeAway")),
      detail.description?.trim(),
    ]
      .filter(Boolean)
      .join(" · ");
  };

  // The + button adds one unit when there's nothing to choose.
  const onAddProduct = (product: Product) => {
    if (!cart.quickAdd(product)) openProduct(product);
  };

  const productsScrollRef = useRef<ScrollView>(null);
  // Top of each category group inside the product list.
  const categoryGroupY = useRef(new Map<string, number>());
  const productsHeight = useRef(0);
  const isAutoScrolling = useRef(false);
  const autoScrollTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(autoScrollTimer.current), []);

  const onChangeSection = useCallback((value: string) => {
    setSection(value);
    setCategory("");
    // The section left behind starts from the top next time; reset it once
    // it has slid off screen.
    const leaving = productsScrollRef.current;
    setTimeout(
      () => leaving?.scrollTo({ y: 0, animated: false }),
      SECTION_RESET_DELAY_MS,
    );
  }, []);

  const onSelectCategory = (id: string) => {
    setCategory(id);
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
    if (isSearching || isAutoScrolling.current) return;
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    // At the very bottom the last group may never reach the line; pick it.
    const atEnd =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 1;
    if (atEnd && sectionCategories.length > 0) {
      setCategory(sectionCategories[sectionCategories.length - 1].id);
      return;
    }
    const y = contentOffset.y + productsHeight.current * CATEGORY_SPY_RATIO;
    let current = sectionCategories[0]?.id;
    for (const c of sectionCategories) {
      const top = categoryGroupY.current.get(c.id);
      if (top !== undefined && top <= y) current = c.id;
    }
    if (current) setCategory(current);
  };

  // Check if menu is loaded
  const hasMenu =
    sections.length > 0 || categories.length > 0 || products.length > 0;

  // Show empty state if no menu loaded
  if (!hasMenu) {
    return (
      <ThemedView
        style={tw`flex-1 px-4 pt-8 items-center justify-center gap-4`}
      >
        <Icon name="utensils" size={64} color={tw.color("gray-400")} />
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
          leftIcon="cloud-download"
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

  const renderProductGrid = (items: Product[]) => (
    // Flat rows; on wide panes they flow into columns
    <View style={[tw`flex-row flex-wrap`, { columnGap: PRODUCT_GAP }]}>
      {items.map((product) => (
        <View
          key={product.id}
          style={productWidth ? { width: productWidth } : tw`w-full`}
        >
          <ProductRow
            product={product}
            onPress={() => openProduct(product)}
            onAdd={
              cart.canQuickAdd(product)
                ? () => onAddProduct(product)
                : undefined
            }
            showOpenHint
            onPressCount={
              cart.mode === "cart" || cart.mode === "edit"
                ? () => onPressCount(product)
                : undefined
            }
            inCartCount={cart.countByProduct.get(product.id) ?? 0}
          />
        </View>
      ))}
    </View>
  );

  // A section's categories column and products. Only the page on screen
  // tracks the selected category and scroll; neighbours show their top.
  const renderSectionPage = (sectionId: string, isActive: boolean) => {
    const pageCategories = isActive
      ? sectionCategories
      : categoriesOfSection(sectionId);
    const selected = isActive ? category : pageCategories[0]?.id;
    return (
      <ThemedView style={tw`flex-row gap-3 flex-1`}>
        <ScrollView
          style={{
            width: isExpanded
              ? CATEGORY_COLUMN_WIDTH
              : CATEGORY_COLUMN_WIDTH_COMPACT,
            flexGrow: 0,
            flexShrink: 0,
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`gap-1 pb-28`}
        >
          {pageCategories.map((c) => {
            const isSelected = selected === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => onSelectCategory(c.id)}
                disabled={!isActive}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={tw.style(
                  "px-3 py-2.5 rounded-md",
                  isSelected && "bg-secondary",
                )}
              >
                <ThemedText
                  type="body2"
                  style={[
                    isSelected ? tw`text-on-secondary` : tw`text-on-surface`,
                    {
                      fontFamily: isSelected
                        ? typography.bold
                        : typography.medium,
                    },
                  ]}
                >
                  {c.name}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
        <ScrollView
          ref={isActive ? productsScrollRef : undefined}
          style={tw`flex-1`}
          onLayout={(e) => {
            setProductsWidth(e.nativeEvent.layout.width);
            if (isActive) productsHeight.current = e.nativeEvent.layout.height;
          }}
          onScroll={isActive ? onProductsScroll : undefined}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={tw`gap-6 pb-28`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={primaryColor}
              colors={[primaryColor]}
            />
          }
        >
          {pageCategories.map((c) => (
            <View
              key={c.id}
              style={tw`gap-1`}
              onLayout={(e) =>
                categoryGroupY.current.set(c.id, e.nativeEvent.layout.y)
              }
            >
              <ThemedText type="h4">{c.name}</ThemedText>
              {renderProductGrid(productsByCategory.get(c.id) ?? [])}
            </View>
          ))}
        </ScrollView>
      </ThemedView>
    );
  };

  const menu = (
    <ScreenLayout fullWidth style={tw`px-4 pt-2 flex-1 gap-4`}>
      {isSaleEditMode && (
        <ThemedView
          style={tw`flex-row items-center gap-3 p-3 rounded-md bg-surface`}
        >
          <Icon name="receipt-text" size={20} color={tw.color("gray-700")} />
          <ThemedText type="body2" style={tw`flex-1`}>
            {t("bills:editSale.menuBanner", { number: saleBillNum })}
          </ThemedText>
        </ThemedView>
      )}
      {isReplaceMode && replacingDetail && (
        <ThemedView
          style={tw`flex-row items-center gap-3 p-3 rounded-md bg-surface`}
        >
          <Icon
            name="arrow-left-right"
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
      <TextInput
        value={search}
        onChangeText={setSearch}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => setIsSearchFocused(false)}
        placeholder={t("menu:searchPlaceholder")}
        icon="search"
        returnKeyType="search"
        autoCorrect={false}
        trailingIcon={
          search ? (
            <IconButton
              icon="circle-x"
              onPress={() => setSearch("")}
              accessibilityLabel={t("common:actions.clear")}
            />
          ) : undefined
        }
      />
      {!search && (
        <TabBar
          scrollable
          textType="h4"
          tabs={sectionTabs}
          activeTab={section}
          onChange={onChangeSection}
        />
      )}
      {isSearching ? (
        <ScrollView
          style={tw`flex-1`}
          onLayout={(e) => setProductsWidth(e.nativeEvent.layout.width)}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={tw`gap-6 pb-28`}
        >
          {searchResults.length > 0 ? (
            renderProductGrid(searchResults)
          ) : (
            <ThemedView style={tw`w-full items-center gap-2 pt-12 px-6`}>
              <Icon name="search-x" size={32} color={tw.color("gray-400")} />
              <ThemedText type="body2" style={tw`text-center text-gray-500`}>
                {t("menu:noResults", { search: search.trim() })}
              </ThemedText>
            </ThemedView>
          )}
        </ScrollView>
      ) : (
        // One page per section: drag left/right and the next section comes
        // in under the finger. Only the section on screen and its
        // neighbours are rendered.
        <TabPager
          tabs={sectionTabs}
          activeTab={section}
          onChange={onChangeSection}
          enabled={!search}
          keepVisited={false}
          renderScene={renderSectionPage}
        />
      )}

      <View
        pointerEvents="box-none"
        style={tw`absolute left-0 right-0 bottom-0 px-4 pb-4`}
      >
        {/* Hidden while searching so it doesn't crowd the keyboard, and
            when the cart is already visible in the side pane. */}
        {!isSearchFocused &&
          cart.count > 0 &&
          (isSaleEditMode ? (
            <MenuCartBar
              label={t("menu:backToSale")}
              icon="receipt-text"
              count={cart.count}
              onPress={() => router.back()}
            />
          ) : (
            !showCartPanel &&
            (cart.mode === "cart" || cart.mode === "edit") && (
              <MenuCartBar
                label={t("menu:goToCart")}
                icon="shopping-cart"
                count={cart.count}
                onPress={() => router.push("/(new-order)/cart")}
              />
            )
          ))}
      </View>

      <ThemedBottomSheetModal
        ref={lineSheetRef}
        enablePanDownToClose
        onChange={(index) => {
          if (index < 0) setLineSheetProductId(null);
        }}
      >
        <ActionsBottomSheet
          title={lineSheetLines[0]?.product.name}
          subtitle={t("menu:editInCart")}
          items={lineSheetLines.map((detail) => ({
            icon: "pencil",
            label: describeLine(detail),
            onPress: () => {
              lineSheetRef.current?.dismiss();
              editLine(detail);
            },
          }))}
        />
      </ThemedBottomSheetModal>
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
