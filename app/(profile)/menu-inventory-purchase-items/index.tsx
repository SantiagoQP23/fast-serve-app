import { useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Chip from "@/presentation/theme/components/chip";
import IconButton from "@/presentation/theme/components/icon-button";
import Label from "@/presentation/theme/components/label";
import NotificationBadge from "@/presentation/theme/components/notification-badge";
import TextInput from "@/presentation/theme/components/text-input";
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import PurchaseQuantityModal, {
  type PurchaseQuantityTarget,
} from "@/presentation/inventory/components/purchase-quantity-modal";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useInventoryItemCategories } from "@/presentation/inventory/hooks/useInventoryItemCategories";
import { usePurchaseCartStore } from "@/presentation/inventory/store/purchaseCartStore";
import type { InventoryItem } from "@/core/inventory/models/inventory-item.model";
import PurchaseCartPanel from "@/presentation/inventory/components/purchase-cart-panel";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";

const ITEM_MIN_WIDTH = 260;
const ITEM_GAP = 12;
const CART_PANEL_WIDTH = 400;

export default function MenuInventoryPurchaseItemsScreen() {
  const { t } = useTranslation("inventory");
  const { items, itemsQuery } = useInventoryItems();
  const { categories } = useInventoryItemCategories();
  const lines = usePurchaseCartStore((state) => state.lines);
  const setLine = usePurchaseCartStore((state) => state.setLine);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [target, setTarget] = useState<PurchaseQuantityTarget | null>(null);

  // Tablet landscape: the cart lives in a side pane next to the picker, and
  // items flow into as many columns as fit the measured list width.
  const { isExpanded, gridColumns } = useResponsiveLayout();
  const [listWidth, setListWidth] = useState(0);
  const columns = isExpanded
    ? gridColumns(ITEM_MIN_WIDTH, ITEM_GAP, listWidth)
    : 1;
  const itemWidth =
    columns > 1 ? (listWidth - ITEM_GAP * (columns - 1)) / columns : undefined;

  const quantities = useMemo(
    () => new Map(lines.map((line) => [line.item.id, line.quantity])),
    [lines],
  );

  // The whole catalog is already loaded (useInventoryItems), so search and
  // category filtering happen locally — no request per keystroke.
  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(
      (item) =>
        item.isActive &&
        (!categoryId || item.category?.id === categoryId) &&
        (!term || item.name.toLowerCase().includes(term)),
    );
  }, [items, search, categoryId]);

  const openItem = (item: InventoryItem) =>
    setTarget({
      item,
      quantity: quantities.get(item.id) ?? 0,
      baseStock: item.quantity,
    });

  const handleConfirm = (quantity: number) => {
    if (target) setLine(target.item, quantity);
    setTarget(null);
  };

  const openCart = () =>
    router.push({ pathname: "/(profile)/menu-inventory-purchase-cart" });

  const picker = (
    <ScreenLayout fullWidth={isExpanded} style={tw`flex-1`}>
      <ThemedView style={tw`px-4 pt-8 gap-4 bg-transparent`}>
        <InventoryScreenHeader
          title={t("purchases.register")}
          right={
            isExpanded ? undefined : (
              <ThemedView style={tw`relative bg-transparent`}>
                <IconButton icon="cart-outline" onPress={openCart} />
                {lines.length > 0 && <NotificationBadge value={lines.length} />}
              </ThemedView>
            )
          }
        />

        <TextInput
          placeholder={t("searchPlaceholder")}
          icon="search-outline"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />

        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`gap-2 items-center`}
          >
            <Chip
              label={t("categories.all")}
              selected={categoryId === null}
              onPress={() => setCategoryId(null)}
            />
            {categories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                selected={categoryId === category.id}
                onPress={() =>
                  setCategoryId((current) =>
                    current === category.id ? null : category.id,
                  )
                }
              />
            ))}
          </ScrollView>
        )}

        <ThemedText type="small" style={tw`text-gray-500`}>
          {t("purchases.selectItemsHint")}
        </ThemedText>
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          tw`px-4 pb-8 pt-4`,
          columns > 1 ? tw`flex-row flex-wrap` : undefined,
          { gap: ITEM_GAP },
        ]}
        onLayout={(e) =>
          // Content width, without the px-4 padding on each side
          setListWidth(e.nativeEvent.layout.width - 32)
        }
      >
        {itemsQuery.isLoading && (
          <ThemedText type="body1" style={tw`text-gray-500 text-center py-8`}>
            {t("loading")}
          </ThemedText>
        )}

        {!itemsQuery.isLoading && visibleItems.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="cube-outline" size={40} color="#999" />
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {items.length === 0 ? t("purchases.noItems") : t("noResults")}
            </ThemedText>
          </ThemedView>
        )}

        {visibleItems.map((item) => {
          const quantity = quantities.get(item.id);
          const unit = t(`units.${item.unit}`);
          return (
            <ThemedView
              key={item.id}
              style={itemWidth ? { width: itemWidth } : undefined}
            >
              <Card
                variant={quantity ? "outline" : "default"}
                onPress={() => openItem(item)}
                style={tw`p-4`}
              >
                <ThemedView
                  style={tw`flex-row items-center justify-between gap-3 bg-transparent`}
                >
                  <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
                    <ThemedText type="body1" numberOfLines={1}>
                      {item.name}
                    </ThemedText>
                    <ThemedText type="small" style={tw`text-gray-500`}>
                      {t("currentStock")}:{" "}
                      {t("quantityWithUnit", { quantity: item.quantity, unit })}
                    </ThemedText>
                  </ThemedView>
                  {quantity ? (
                    <Label
                      text={`+${t("quantityWithUnit", { quantity, unit })}`}
                      color="success"
                      size="small"
                    />
                  ) : (
                    <Ionicons
                      name="add-circle-outline"
                      size={24}
                      color={tw.color("gray-400")}
                    />
                  )}
                </ThemedView>
              </Card>
            </ThemedView>
          );
        })}
      </ScrollView>

      {!isExpanded && lines.length > 0 && (
        <ThemedView style={tw`px-4 pb-2 pt-2 bg-transparent`}>
          <Button
            leftIcon="cart-outline"
            label={t("purchases.viewSummary", { count: lines.length })}
            onPress={openCart}
          />
        </ThemedView>
      )}

      <PurchaseQuantityModal
        target={target}
        onConfirm={handleConfirm}
        onClose={() => setTarget(null)}
      />
    </ScreenLayout>
  );

  if (!isExpanded) return picker;

  return (
    <ThemedView style={tw`flex-1 flex-row bg-background`}>
      <ThemedView style={tw`flex-1`}>{picker}</ThemedView>
      <ThemedView
        style={[
          tw`border-l border-outline-variant`,
          { width: CART_PANEL_WIDTH },
        ]}
      >
        <PurchaseCartPanel embedded />
      </ThemedView>
    </ThemedView>
  );
}
