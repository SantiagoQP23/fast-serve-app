import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, PressableProps } from "react-native";

export interface PaymentMethod {
  name: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface PaymentMethodCardProps extends PressableProps {
  paymentMethod: PaymentMethod;
  active?: boolean;
  variant?: "horizontal" | "vertical";
}

export default function PaymentMethodCard({
  paymentMethod,
  active = false,
  variant = "horizontal",
  onPress,
}: PaymentMethodCardProps) {
  if (variant === "vertical") {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          tw`flex-row items-center px-4 py-4 rounded-2xl border border-gray-200`,
          pressed && tw`opacity-80`,
          active && tw`border-light-primary bg-gray-100`,
        ]}
      >
        <ThemedView
          style={tw`w-10 h-10 rounded-full bg-gray-100 items-center justify-center`}
        >
          <Ionicons
            name={paymentMethod.icon}
            size={22}
            color={tw.color("gray-700")}
          />
        </ThemedView>
        <ThemedText type="h4" style={tw`flex-1 ml-3`}>
          {paymentMethod.name}
        </ThemedText>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={tw.color("gray-400")}
        />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        tw`py-4 px-10 rounded-2xl items-center border border-gray-200`,
        pressed && tw`opacity-80`,
        active && tw`border-light-primary bg-gray-100`,
      ]}
    >
      <Ionicons
        name={paymentMethod.icon}
        size={30}
        color={tw.color("gray-700")}
      />
      <ThemedView style={tw`flex-row items-center bg-transparent`}>
        <ThemedText type="h4">{paymentMethod.name}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}
