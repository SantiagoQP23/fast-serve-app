import { Product } from "@/core/menu/models/product.model";
import {
  getProductOptionAvailableQuantity,
  getProductOptionStockLevel,
} from "@/core/menu/models/product-optionl.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import React from "react";
import { PressableProps } from "react-native";
import Card from "../theme/components/card";

interface ProductCardProps extends PressableProps {
  product: Product;
}

const STOCK_TEXT_COLOR = {
  ok: "text-gray-500",
  low: "text-orange-700",
  out: "text-red-700",
};

export default function ProductCard({ product, onPress }: ProductCardProps) {
  const { t } = useTranslation(["menu"]);
  const activeOptions = product.options.filter((option) => option.isActive);
  const singleOption = activeOptions.length === 1 ? activeOptions[0] : null;

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

  return (
    <Card
      style={({ pressed }) => [
        tw` p-4 rounded-2xl bg-surface-container-low`,
        pressed && tw`opacity-80`,
      ]}
      onPress={onPress}
    >
      <ThemedView style={tw` bg-transparent gap-2 `}>
        <ThemedText type="body1" style={[tw``, {}]}>
          {product.name}
        </ThemedText>
        <ThemedView
          style={tw`bg-transparent flex-row items-center justify-between gap-2`}
        >
          <ThemedText type="body2" style={tw`text-gray-600 flex-shrink`}>
            {product.options.length > 1
              ? product.options.map((option) => option.name).join(" - ")
              : product.options[0]
                ? `$${product.options[0].price}`
                : "No options available"}
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
      </ThemedView>
    </Card>
  );
}
