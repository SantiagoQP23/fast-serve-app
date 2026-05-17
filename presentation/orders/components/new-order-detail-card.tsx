import React, { useEffect, useState } from "react";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { View, Pressable, PressableProps } from "react-native";
import Label from "@/presentation/theme/components/label";
import { useCounter } from "@/presentation/shared/hooks/useCounter";
import { router } from "expo-router";
import { NewOrderDetail } from "@/core/orders/dto/new-order-detail.dto";
import { useNewOrderStore } from "../store/newOrderStore";

import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import IconButton from "@/presentation/theme/components/icon-button";

interface NewOrderDetailCardProps extends PressableProps {
  detail: NewOrderDetail;
}

export default function NewOrderDetailCard({
  detail,
  onPress,
}: NewOrderDetailCardProps) {
  const { removeDetail, updateDetail } = useNewOrderStore();
  const { counter, increment, decrement } = useCounter(
    detail.quantity,
    1,
    20,
    1,
    (value) => {
      const updatedDetail = { ...detail, quantity: value };
      updateDetail(updatedDetail);
    },
  );

  const onRemoveDetail = () => {
    removeDetail(detail);
  };

  const showProductOptionName =
    detail.product.options.length > 1 && detail.productOption;

  return (
    <Swipeable
      renderRightActions={() => (
        <ThemedView style={tw`justify-center items-center px-4 `}>
          <IconButton
            icon="trash-outline"
            color="red"
            onPress={onRemoveDetail}
          />
        </ThemedView>
      )}
    >
      <Pressable
        style={({ pressed }) => [
          tw` rounded-2xl  dark:bg-gray-800 border border-light-border`,
          pressed && tw`opacity-80`,
        ]}
        onPress={onPress}
      >
        <ThemedView style={tw`flex-col bg-transparent p-4 gap-4`}>
          {/* <ThemedView */}
          {/*   style={tw`absolute  rounded-full items-center justify-center  z-10 right-0 top-0`} */}
          {/* ></ThemedView> */}
          <ThemedView
            style={tw`flex-row bg-transparent justify-between items-start gap-2`}
          >
            <ThemedView>
              <ThemedText type="h4" style={tw``}>
                {detail.product.name}{" "}
                {showProductOptionName && detail.productOption.name}
              </ThemedText>
              {detail.description && (
                <ThemedText type="small">{detail.description}</ThemedText>
              )}
            </ThemedView>
            {/* <IconButton */}
            {/*   icon="close-outline" */}
            {/*   style={tw`bg-gray-100`} */}
            {/*   size={18} */}
            {/*   onPress={onRemoveDetail} */}
            {/* /> */}
          </ThemedView>
          {detail.tagIds && detail.tagIds.length > 0 && (
            <ThemedView style={tw`flex-row flex-wrap gap-2 bg-transparent`}>
              {detail.product.tags
                .filter((tag) => detail.tagIds!.includes(tag.id))
                .map((tag) => (
                  <Label key={tag.id} text={tag.name} color="default" />
                ))}
            </ThemedView>
          )}
          <ThemedView
            style={tw`flex-row bg-transparent justify-between gap-2 items-center`}
          >
            <ThemedText
              type="body1"
              style={tw`text-light-primary font-semibold`}
            >
              ${(detail.price ?? detail.product.price) * counter}
            </ThemedText>
            <ThemedView style={tw`flex-row items-center gap-3 bg-transparent`}>
              <IconButton
                icon="remove-outline"
                onPress={decrement}
                variant="outlined"
              />
              <ThemedText>{counter}</ThemedText>
              <IconButton icon="add" onPress={increment} variant="outlined" />
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Pressable>
    </Swipeable>
  );
}
