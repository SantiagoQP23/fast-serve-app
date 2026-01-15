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
import ProgressBar from "@/presentation/theme/components/progress-bar";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

interface NewBillDetailCardProps extends PressableProps {
  detail: OrderDetail;
  quantity?: number;
  onChange?: (quantity: number) => void;
}

export default function NewBillDetailCard({
  onPress,
  onChange,
  quantity = 0,
  detail,
}: NewBillDetailCardProps) {
  const { t } = useTranslation(["bills"]);
  const { counter, increment, decrement, setCounter } = useCounter(
    quantity,
    1,
    detail.quantity - detail.qtyPaid,
    0,
    (value) => {
      onChange && onChange(value);
    },
  );

  useEffect(() => {
    setCounter(quantity);
  }, [quantity, setCounter]);

  const availableQty = detail.quantity - detail.qtyPaid;
  const isSelected = counter > 0;

  return (
    <Pressable
      style={({ pressed }) => [
        tw`p-4 rounded-xl border gap-3`,
        isSelected ? tw`border-blue-400` : tw`border-gray-200`,
        pressed && tw`opacity-60`,
      ]}
      onPress={onPress}
    >
      {/* Product Info */}
      <ThemedView
        style={tw`flex-row justify-between items-center bg-transparent`}
      >
        <ThemedView style={tw`bg-transparent flex-1`}>
          <ThemedText type="body1" style={tw`font-semibold mb-0.5`}>
            {detail.product.name}
          </ThemedText>
          <ThemedText type="caption" style={tw`text-gray-500`}>
            {formatCurrency(detail.price)} × {availableQty}{" "}
            {t("bills:newBill.available")}
          </ThemedText>
        </ThemedView>

        {/* Counter Controls */}
        <ThemedView style={tw`flex-row items-center gap-2 bg-transparent`}>
          <IconButton
            icon="remove-circle-outline"
            onPress={decrement}
            color={counter === 0 ? tw.color("gray-300") : tw.color("gray-700")}
            disabled={counter === 0}
          />
          <ThemedText type="h4" style={tw`font-bold min-w-8 text-center`}>
            {counter}
          </ThemedText>
          <IconButton
            icon="add-circle-outline"
            onPress={increment}
            color={
              counter === availableQty
                ? tw.color("gray-300")
                : tw.color("blue-600")
            }
            disabled={counter === availableQty}
          />
        </ThemedView>
      </ThemedView>
      {isSelected && (
        <ProgressBar
          progress={counter / (detail.quantity - detail.qtyPaid)}
          height={1}
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
            <ThemedText type="body1" style={tw`font-semibold`}>
              {formatCurrency(detail.price * counter)}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      )}
    </Pressable>
  );
}
