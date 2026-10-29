import { RefreshControl, ScrollView } from "react-native";
import { router } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useLowStock } from "@/presentation/inventory/hooks/useLowStock";
import InventorySectionHeader from "@/presentation/inventory/components/inventory-section-header";
import InventoryItemCard from "@/presentation/inventory/components/inventory-item-card";
import MenuProductCard from "@/presentation/menu-management/components/menu-product-card";
import type { InventoryItem } from "@/core/inventory/models/inventory-item.model";
import type { Product } from "@/core/menu/models/product.model";

interface InventoryLowStockTabProps {
  /** Overrides navigating to the item screen, e.g. to open a side pane. */
  onOpenItem?: (item: InventoryItem) => void;
  /** Overrides navigating to the product screen, e.g. to open a side pane. */
  onOpenProduct?: (product: Product) => void;
  /** Item or product currently shown in the side pane. */
  activeId?: string;
}

/**
 * Everything that needs restocking in one place: menu products out of stock
 * or running low, then insumos below their minimum, most urgent first.
 */
export default function InventoryLowStockTab({
  onOpenItem,
  onOpenProduct,
  activeId,
}: InventoryLowStockTabProps) {
  const { t } = useTranslation("inventory");
  const { products, items, total, isLoading, isError, isFetching, refetch } =
    useLowStock();

  const openProduct = (product: Product) =>
    onOpenProduct
      ? onOpenProduct(product)
      : router.push({
          pathname: "/(profile)/menu/products/detail",
          params: { productId: product.id },
        });

  const openItem = (item: InventoryItem) =>
    onOpenItem
      ? onOpenItem(item)
      : router.push({
          pathname: "/(profile)/inventory/items/detail",
          params: { itemId: item.id },
        });

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={tw`px-4 gap-6 pb-8 pt-6`}
      refreshControl={
        <RefreshControl
          refreshing={isFetching && !isLoading}
          onRefresh={refetch}
          tintColor={tw.color("primary")}
          colors={[tw.color("primary") as string]}
        />
      }
    >
      {isLoading && (
        <ThemedText type="body1" style={tw`text-gray-500 text-center py-8`}>
          {t("loading")}
        </ThemedText>
      )}

      {/* A failed refresh keeps showing what was already loaded */}
      {isError && !isLoading && total === 0 && (
        <ThemedView style={tw`items-center py-8 gap-3 bg-transparent`}>
          <Icon name="circle-alert" size={48} color={tw.color("red-500")} />
          <ThemedText type="body1" style={tw`text-red-500`}>
            {t("lowStock.loadError")}
          </ThemedText>
          <Button label={t("retry")} onPress={refetch} variant="outline" />
        </ThemedView>
      )}

      {!isLoading && !isError && total === 0 && (
        <ThemedView style={tw`items-center py-8 gap-3 bg-transparent`}>
          <Icon name="circle-check" size={48} color={tw.color("gray-400")} />
          <ThemedText
            type="body1"
            style={tw`text-center text-gray-500 px-4`}
          >
            {t("lowStock.empty")}
          </ThemedText>
        </ThemedView>
      )}

      {products.length > 0 && (
        <ThemedView style={tw`gap-3 bg-transparent`}>
          <InventorySectionHeader
            title={t("lowStock.products")}
            count={products.length}
            highlight
          />
          <ThemedView style={tw`gap-2 bg-transparent`}>
            {products.map((product) => (
              <MenuProductCard
                key={product.id}
                product={product}
                onPress={openProduct}
                showCategory
                active={activeId === product.id}
              />
            ))}
          </ThemedView>
        </ThemedView>
      )}

      {items.length > 0 && (
        <ThemedView style={tw`gap-3 bg-transparent`}>
          <InventorySectionHeader
            title={t("lowStock.inventory")}
            count={items.length}
            highlight
          />
          <ThemedView style={tw`gap-2 bg-transparent`}>
            {items.map((item) => (
              <InventoryItemCard
                key={item.id}
                item={item}
                onPress={openItem}
                showCategory
                active={activeId === item.id}
              />
            ))}
          </ThemedView>
        </ThemedView>
      )}
    </ScrollView>
  );
}
