import type { ReactNode } from "react";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Label from "@/presentation/theme/components/label";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import {
  getProductActiveOptions,
  type Product,
} from "@/core/menu/models/product.model";
import {
  getProductOptionAvailableQuantity,
  getProductOptionStockLevel,
  getVariantStockMode,
  type ProductOption,
} from "@/core/menu/models/product-optionl.model";

/**
 * A product's variants in the menu list: one row each with its price and,
 * when it tracks stock, what's left. A product without variants gets one
 * row with no name.
 */
export default function ProductVariantList({ product }: { product: Product }) {
  const options = getProductActiveOptions(product);
  const showNames = product.hasVariants !== false || options.length > 1;

  return (
    <ThemedView style={tw`gap-1.5 bg-transparent`}>
      {options.map((option) => (
        <VariantRow key={option.id} option={option} showName={showNames} />
      ))}
    </ThemedView>
  );
}

/** One variant: name, stock left (when tracked) and price. */
export function VariantRow({
  option,
  showName,
  leading,
}: {
  option: ProductOption;
  showName: boolean;
  /** Before the name, e.g. the product screen's default star. */
  leading?: ReactNode;
}) {
  const { t } = useTranslation("inventory");
  const mode = getVariantStockMode(option);
  const available = getProductOptionAvailableQuantity(option);
  const level = getProductOptionStockLevel(option, available);

  // Oversold (below zero) reads as none left
  const quantity = Math.max(available ?? 0, 0);
  // Spoken in full, since the label shows just an icon and a number
  const stockDescription =
    mode === "own"
      ? (available ?? 0) < 0
        ? t("variant.soldWithoutStock", { count: -(available ?? 0) })
        : t("variant.inStock", { count: quantity })
      : t("variant.coversShort", { count: quantity });

  return (
    <ThemedView style={tw`flex-row items-center gap-2 min-h-6 bg-transparent`}>
      {leading}
      <ThemedText type="body2" style={tw`flex-1`} numberOfLines={1}>
        {showName ? option.name : ""}
      </ThemedText>
      {mode !== "none" && (
        <Label
          text={String(quantity)}
          leftIcon={mode === "own" ? "package" : "chef-hat"}
          color={
            level === "out" ? "error" : level === "low" ? "warning" : "default"
          }
          size="small"
          accessibilityLabel={stockDescription}
        />
      )}
      {/* Last and right-aligned so prices line up down the list */}
      <ThemedText
        type="body2"
        style={[
          tw`text-right min-w-16`,
          { fontFamily: typography.semibold, fontVariant: ["tabular-nums"] },
        ]}
      >
        {formatCurrency(option.price)}
      </ThemedText>
    </ThemedView>
  );
}
