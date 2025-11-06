import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Pressable } from "react-native";

export interface Order {
  num: number;
}

interface OrderCardProps {
  order: Order;
}

export default function OrderCard({ order }: OrderCardProps) {
  return (
    <Pressable
      onPress={() => console.log("Card pressed")}
      style={({ pressed }) => [
        tw`mb-3 p-4 rounded-2xl bg-gray-100 dark:bg-gray-800`,
        pressed && tw`opacity-80`,
      ]}
    >
      <ThemedView
        style={tw`flex-row items-center bg-transparent justify-between`}
      >
        <ThemedText style={tw`text  `}>Order N {order.num}</ThemedText>
        <ThemedView
          style={tw` flex-row justify-end bg-transparent items-center gap-2`}
        >
          <View
            style={[
              tw`w-3 h-3 rounded-full `,
              true ? tw`bg-green-500` : tw`bg-red-500`,
            ]}
          />
          <ThemedText>Delivered</ThemedText>
        </ThemedView>
      </ThemedView>
      <ThemedView style={tw`flex-row items-center bg-transparent gap-5 my-2`}>
        <ThemedText style={tw`text-lg font-semibold`}>Mesa 1</ThemedText>

        <ThemedView
          style={tw` flex-row justify-end bg-transparent items-center gap-2`}
        >
          <Ionicons name="people-outline" size={18} />
          <ThemedText>5</ThemedText>
        </ThemedView>
      </ThemedView>
      <ThemedText>Santiago Quirumbay</ThemedText>
      <ThemedView
        style={tw`flex-row items-center bg-transparent justify-between mt-3`}
      >
        <ThemedText>Today, 13:30</ThemedText>
        <ThemedText style={tw`text-xl font-bold`}>$55</ThemedText>
      </ThemedView>
    </Pressable>
  );
}
