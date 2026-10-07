import React, { useEffect, useState } from "react";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { View, Pressable, PressableProps } from "react-native";
import IconButton from "@/presentation/theme/components/icon-button";
import { OrderDetail } from "@/core/orders/models/order-detail.model";
import { useCounter } from "@/presentation/shared/hooks/useCounter";
import { formatCurrency } from "@/core/i18n/utils";
import Slider from "@/presentation/theme/components/slider";
import Checkbox from "@/presentation/theme/components/checkbox";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import Card from "@/presentation/theme/components/card";

interface NewBillDetailCardProps extends PressableProps {
  detail: OrderDetail;
  quantity?: number;
  maxQuantity?: number;
  onChange?: (quantity: number) => void;
}

export default function NewBillDetailCard({
  onPress,
  onChange,
  quantity = 0,
  maxQuantity,
  detail,
}: NewBillDetailCardProps) {
  const { t } = useTranslation(["bills"]);
  const availableQty = maxQuantity ?? detail.quantity - detail.qtyPaid;

  const { counter, increment, decrement, setCounter } = useCounter(
    quantity,
    1,
    availableQty,
    0,
    (value) => {
      onChange && onChange(value);
    },
  );

  useEffect(() => {
    setCounter(quantity);
  }, [quantity, setCounter]);
  const isSelected = counter > 0;

  const handleQuantityChange = (value: number) => {
    setCounter(value);
    onChange && onChange(value);
  };

  const showProductOptionName =
    detail.product.options.length > 1 && detail.productOption;

  return (
    <Card
      style={({ pressed }) => [
        tw`p-6 rounded-3xl gap-4`,
        isSelected ? tw`border-2 border-light-primary` : tw``,
        pressed && tw`opacity-60`,
      ]}
      onPress={onPress}
      variant={isSelected ? "default" : "outline"}
    >
      {/* Product Info */}
      <ThemedView
        style={tw`flex-row justify-between items-center bg-transparent`}
      >
        <ThemedView style={tw`bg-transparent flex-1`}>
          <ThemedText type="body1" style={tw`font-semibold mb-1`}>
            {detail.product.name}{" "}
            {showProductOptionName && `${detail.productOption?.name}`} ×{" "}
            {availableQty}
          </ThemedText>
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {formatCurrency(detail.price)}{" "}
          </ThemedText>
        </ThemedView>

        {/* Counter Controls */}
        <ThemedView style={tw`flex-row items-center gap-2 bg-transparent`}>
          {availableQty === 1 ? (
            <Checkbox
              value={isSelected}
              onValueChange={(checked) => handleQuantityChange(checked ? 1 : 0)}
            />
          ) : (
            <>
              <IconButton
                icon="remove-outline"
                variant="outlined"
                onPress={decrement}
                style={tw`p-2`}
              />
              <ThemedText type="h4" style={tw` min-w-8 text-center`}>
                {counter}
              </ThemedText>
              <IconButton
                icon="add-outline"
                onPress={increment}
                variant="outlined"
                color={
                  counter === availableQty
                    ? tw.color("gray-300")
                    : tw.color("border-light-primary")
                }
                style={tw`p-2`}
              />
            </>
          )}
        </ThemedView>
      </ThemedView>
      {availableQty > 1 && (
        <Slider
          value={counter}
          minimumValue={0}
          maximumValue={availableQty}
          step={1}
          height={12}
          onValueChange={handleQuantityChange}
          onSlidingComplete={handleQuantityChange}
        />
      )}

      {/* Subtotal - only show when selected */}
      {isSelected && (
        <ThemedView style={tw`bg-transparent `}>
          <ThemedView
            style={tw`flex-row justify-between items-center bg-transparent`}
          >
            <ThemedText type="caption" style={tw`text-gray-500`}>
              {t("bills:newBill.subtotal")}
            </ThemedText>
            <ThemedText type="body1" style={tw``}>
              {formatCurrency(detail.price * counter)}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      )}
    </Card>
  );
}
