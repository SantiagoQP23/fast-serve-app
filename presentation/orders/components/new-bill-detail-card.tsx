import React, { useEffect, useState } from "react";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { View, Pressable, PressableProps } from "react-native";
import IconButton from "@/presentation/theme/components/icon-button";
import { OrderDetail } from "@/core/orders/models/order-detail.model";
import { useCounter } from "@/presentation/shared/hooks/useCounter";
import ProgressBar from "@/presentation/theme/components/progress-bar";
import { formatCurrency } from "@/core/i18n/utils";

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
  const progressPercentage = availableQty > 0 ? (counter / availableQty) * 100 : 0;
  const isSelected = counter > 0;

  return (
    <Pressable
      style={({ pressed }) => [
        tw`p-4 rounded-2xl border-2 gap-3 shadow-sm`,
        isSelected 
          ? tw`bg-blue-50 border-blue-300` 
          : tw`bg-white border-gray-200`,
        pressed && tw`opacity-80`,
      ]}
      onPress={onPress}
    >
      {/* Header: Product Name and Available Quantity */}
      <ThemedView style={tw`flex-row justify-between items-start bg-transparent`}>
        <ThemedView style={tw`bg-transparent flex-1 gap-1.5`}>
          <ThemedText type="h4" style={tw`font-bold`}>
            {detail.product.name}
          </ThemedText>
          <ThemedView style={tw`flex-row items-center gap-2 bg-transparent`}>
            <ThemedView style={tw`flex-row items-center gap-1 bg-transparent`}>
              <Ionicons 
                name="pricetag-outline" 
                size={14} 
                color={tw.color("gray-500")} 
              />
              <ThemedText type="caption" style={tw`text-gray-500`}>
                {formatCurrency(detail.price)} each
              </ThemedText>
            </ThemedView>
            <ThemedText type="caption" style={tw`text-gray-400`}>•</ThemedText>
            <ThemedView style={tw`flex-row items-center gap-1 bg-transparent`}>
              <Ionicons 
                name="cube-outline" 
                size={14} 
                color={tw.color("gray-500")} 
              />
              <ThemedText type="caption" style={tw`text-gray-500`}>
                {availableQty} available
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
        {isSelected && (
          <ThemedView style={tw`bg-blue-500/10 px-2.5 py-1 rounded-full`}>
            <Ionicons 
              name="checkmark-circle" 
              size={20} 
              color={tw.color("blue-600")} 
            />
          </ThemedView>
        )}
      </ThemedView>

      {/* Divider */}
      <ThemedView style={tw`h-px bg-gray-200`} />

      {/* Counter and Total */}
      <ThemedView
        style={tw`flex-row justify-between items-center bg-transparent`}
      >
        <ThemedView style={tw`bg-transparent gap-1`}>
          <ThemedText type="caption" style={tw`text-gray-600`}>
            Subtotal
          </ThemedText>
          <ThemedText type="h3" style={tw`font-bold ${isSelected ? 'text-blue-600' : ''}`}>
            {formatCurrency(detail.price * counter)}
          </ThemedText>
        </ThemedView>
        
        {/* Counter Controls */}
        <ThemedView style={tw`flex-row items-center gap-3 bg-transparent`}>
          <IconButton
            icon="remove-circle-outline"
            onPress={decrement}
            color={counter === 0 ? tw.color("gray-300") : tw.color("red-500")}
            disabled={counter === 0}
          />
          <ThemedView style={tw`bg-gray-100 px-4 py-2 rounded-lg min-w-12 items-center`}>
            <ThemedText type="h4" style={tw`font-bold`}>
              {counter}
            </ThemedText>
          </ThemedView>
          <IconButton 
            icon="add-circle-outline" 
            onPress={increment}
            color={counter === availableQty ? tw.color("gray-300") : tw.color("blue-500")}
            disabled={counter === availableQty}
          />
        </ThemedView>
      </ThemedView>

      {/* Progress Bar */}
      {counter > 0 && (
        <ThemedView style={tw`bg-transparent gap-2`}>
          <ThemedView style={tw`flex-row justify-between items-center bg-transparent`}>
            <ThemedText type="caption" style={tw`text-gray-500`}>
              {counter} of {availableQty} selected
            </ThemedText>
            <ThemedText type="caption" style={tw`text-blue-600 font-semibold`}>
              {progressPercentage.toFixed(0)}%
            </ThemedText>
          </ThemedView>
          <ProgressBar
            progress={counter / availableQty}
            height={2}
            progressColor="bg-blue-500"
            bgColor="bg-blue-100"
          />
        </ThemedView>
      )}
    </Pressable>
  );
}
