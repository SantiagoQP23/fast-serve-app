import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Card from "@/presentation/theme/components/card";
import Label from "@/presentation/theme/components/label";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import type { Product } from "@/core/menu/models/product.model";
import ProductVariantList from "@/presentation/menu-management/components/product-variant-list";

interface MenuProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  onLongPress?: (product: Product) => void;
  accessibilityHint?: string;
  /** For lists that span categories: says where each product is. */
  showCategory?: boolean;
  /** Highlights the product open in the detail pane (tablet). */
  active?: boolean;
}

/** A menu product with its variants' prices and stock. */
export default function MenuProductCard({
  product,
  onPress,
  onLongPress,
  accessibilityHint,
  showCategory = false,
  active = false,
}: MenuProductCardProps) {
  const { t } = useTranslation("menuManagement");

  return (
    <Card
      onPress={() => onPress(product)}
      onLongPress={onLongPress ? () => onLongPress(product) : undefined}
      accessibilityHint={accessibilityHint}
      style={tw.style("px-4 py-3", active && "bg-secondary")}
    >
      <ThemedView style={tw`gap-2 bg-transparent`}>
        <ThemedView style={tw`flex-row items-center gap-2 bg-transparent`}>
          <ThemedText
            type="body1"
            style={tw.style("flex-1", !product.isActive && "text-gray-500")}
            numberOfLines={2}
          >
            {product.name}
          </ThemedText>
          {!product.isActive && <Label text={t("inactive")} size="small" />}
        </ThemedView>
        {showCategory && (
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
}
