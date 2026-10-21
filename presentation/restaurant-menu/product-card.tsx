import { Product, ProductStatus } from "@/core/menu/models/product.model";
import {
  getProductOptionAvailableQuantity,
  getProductOptionStockLevel,
} from "@/core/menu/models/product-optionl.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Icon from "@/presentation/theme/components/icon";
import Label from "@/presentation/theme/components/label";
import tw from "@/presentation/theme/lib/tailwind";
import { PressableProps } from "react-native";
import Animated from "react-native-reanimated";
import { useCountPop } from "@/presentation/shared/hooks/useCountPop";
import Card from "../theme/components/card";

interface ProductCardProps extends PressableProps {
  product: Product;
  /** Units of this product already in the cart, shown as a count. */
  inCartCount?: number;
  /** What a tap does, hinted at the trailing edge: add one unit or open it. */
  tapAction?: "add" | "open";
}

const STOCK_TEXT_COLOR = {
  ok: "text-gray-500",
  low: "text-orange-700",
  out: "text-red-700",
};

/** Ink count of units already in the cart; pops when it goes up. */
function InCartCount({ count }: { count: number }) {
  const popStyle = useCountPop(count);

  return (
    <Animated.View
      style={[
        tw`min-w-9 h-9 px-2 rounded-full bg-secondary items-center justify-center`,
        popStyle,
      ]}
    >
      <ThemedText type="body2" style={tw`text-on-secondary font-bold`}>
        ×{count}
      </ThemedText>
    </Animated.View>
  );
}

export default function ProductCard({
  product,
  onPress,
  onLongPress,
  inCartCount = 0,
  tapAction,
}: ProductCardProps) {
  const { t } = useTranslation(["menu"]);
  const activeOptions = product.options.filter((option) => option.isActive);
  const singleOption = activeOptions.length === 1 ? activeOptions[0] : null;
  const isUnavailable = product.status !== ProductStatus.AVAILABLE;

  // Single variant: show its remaining units. Several variants: only flag
  // the product when every tracked variant has run out.
  let stock: { level: "ok" | "low" | "out"; text: string } | null = null;
  if (singleOption) {
    const available = getProductOptionAvailableQuantity(singleOption);
    const level = getProductOptionStockLevel(singleOption, available);
    if (level) {
      stock = {
        level,
        text:
          level === "out"
            ? t("menu:product.stock.out")
            : t("menu:product.stock.left", { count: available ?? 0 }),
      };
    }
  } else {
    const levels = activeOptions
      .map((option) => getProductOptionStockLevel(option))
      .filter((level) => level !== null);
    if (
      levels.length === activeOptions.length &&
      levels.length > 0 &&
      levels.every((level) => level === "out")
    ) {
      stock = { level: "out", text: t("menu:product.stock.out") };
    }
  }

  const prices = activeOptions.map((option) => option.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceText =
    activeOptions.length === 0
      ? t("menu:product.noOptions")
      : minPrice === maxPrice
        ? formatCurrency(minPrice)
        : `${formatCurrency(minPrice)} – ${formatCurrency(maxPrice)}`;

  const trailing =
    inCartCount > 0 ? (
      <InCartCount count={inCartCount} />
    ) : tapAction && !isUnavailable ? (
      <ThemedView
        style={tw`w-9 h-9 rounded-full bg-surface items-center justify-center`}
      >
        <Icon name={tapAction === "add" ? "plus" : "chevron-right"} size={18} />
      </ThemedView>
    ) : null;

  return (
    <Card
      style={tw`p-4`}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={[
        product.name,
        priceText,
        stock?.text,
        isUnavailable ? t(`menu:product.status.${product.status}`) : null,
        inCartCount > 0 ? t("menu:inCart", { count: inCartCount }) : null,
      ]
        .filter(Boolean)
        .join(", ")}
      accessibilityHint={
        tapAction === "add" ? t("menu:quickAddHint") : undefined
      }
      variant="outline"
    >
      <ThemedView style={tw`bg-transparent gap-2`}>
        <ThemedView style={tw`bg-transparent flex-row items-start gap-2`}>
          <ThemedText type="body1" style={tw`flex-1 pt-1.5`}>
            {product.name}
          </ThemedText>
          {trailing}
        </ThemedView>
        <ThemedView
          style={tw`bg-transparent flex-row flex-wrap items-center justify-between gap-x-2`}
        >
          <ThemedText type="body2" style={tw`text-gray-600`}>
            {priceText}
          </ThemedText>
          {stock && (
            <ThemedText
              type="small"
              style={tw`${STOCK_TEXT_COLOR[stock.level]}`}
            >
              {stock.text}
            </ThemedText>
          )}
        </ThemedView>
        {isUnavailable && (
          <ThemedView style={tw`bg-transparent flex-row`}>
            <Label
              size="small"
              color={
                product.status === ProductStatus.OUT_OF_STOCK
                  ? "error"
                  : "warning"
              }
              text={t(`menu:product.status.${product.status}`)}
            />
          </ThemedView>
        )}
      </ThemedView>
    </Card>
  );
}
