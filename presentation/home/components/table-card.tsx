import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import React from "react";
import { View, Pressable, PressableProps } from "react-native";
export interface Table {
  name: string;
  isAvailable: boolean;
}

interface TableCardProps extends PressableProps {
  table: Table;
}

export default function TableCard({ table, onPress }: TableCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        tw`w-[48%]  p-4 rounded-2xl bg-gray-100 dark:bg-gray-800`,
        pressed && tw`opacity-80`,
      ]}
    >
      <ThemedView style={tw`mb-3 flex-row justify-end bg-transparent`}>
        <View
          style={[
            tw`w-3 h-3 rounded-full `,
            table.isAvailable ? tw`bg-green-500` : tw`bg-red-500`,
          ]}
        />
      </ThemedView>
      <ThemedView style={tw`flex-row items-center bg-transparent`}>
        <ThemedText type="h3">{table.name}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}
