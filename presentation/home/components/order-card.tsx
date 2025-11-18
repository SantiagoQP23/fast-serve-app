import Card from "@/presentation/theme/components/card";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { View, Pressable } from "react-native";

export interface Order {
  num: number;
  status?: "delivered" | "inProgress" | "pending";
}

interface OrderCardProps {
  order: Order;
}

export default function OrderCard({ order }: OrderCardProps) {
  const status = order.status || "pending";
  const backgroundColors = {
    delivered: "bg-green-500",
    inProgress: "bg-blue-500",
    pending: "bg-orange-500",
  };

  const textColors = {
    delivered: "text-green-700",
    inProgress: "text-blue-700",
    pending: "text-orange-700",
  };

  const statusText = {
    delivered: "Delivered",
    inProgress: "In Progress",
    pending: "Pending",
  };

  return (
    <ThemedView style={tw`mb-3  rounded-2xl `}>
      <Card onPress={() => router.push(`/(order)/${order.num}`)}>
        <ThemedView style={tw`gap-3 bg-transparent`}>
          <ThemedView
            style={tw`flex-row items-center bg-transparent justify-between`}
          >
            <ThemedText type="body1" style={tw``}>
              Santiago Quirumbay
            </ThemedText>
            {/* <ThemedText type="caption">Order N {order.num}</ThemedText> */}
            <ThemedView
              style={tw` flex-row justify-end bg-transparent items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-full px-2 py-1`}
            >
              <View
                style={[
                  tw`w-2 h-2 rounded-full `,
                  tw`${backgroundColors[status]}`,
                ]}
              />
              <ThemedText style={tw`${textColors[status]}`} type="body2">
                {statusText[status]}
              </ThemedText>
            </ThemedView>
          </ThemedView>
          <ThemedView style={tw`flex-row items-center bg-transparent gap-5 `}>
            <ThemedText type="h3">Mesa 1</ThemedText>

            <ThemedView
              style={tw` flex-row justify-end bg-transparent items-center gap-2`}
            >
              <Ionicons name="people-outline" size={18} />
              <ThemedText type="body2">5</ThemedText>
            </ThemedView>
          </ThemedView>
          <ThemedView
            style={tw`flex-row items-center bg-transparent justify-between `}
          >
            <ThemedText type="body2">Order #111 - Today, 13:30</ThemedText>
            <ThemedText type="h3">$55</ThemedText>
          </ThemedView>
        </ThemedView>
      </Card>
    </ThemedView>
  );
}
