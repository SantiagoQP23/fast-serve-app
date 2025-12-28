import React from "react";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  loading?: boolean;
}

export default function StatsCard({
  title,
  value,
  icon,
  iconColor = "#3b82f6",
  loading = false,
}: StatsCardProps) {
  return (
    <ThemedView style={tw`flex-1 rounded-2xl border border-gray-300 p-4 shadow-sm`}>
      <ThemedView style={tw`flex-row items-center justify-between`}>
        <ThemedView style={tw`flex-1`}>
          <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
            {title}
          </ThemedText>
          {loading ? (
            <ThemedText type="h3" style={tw`text-gray-400`}>
              --
            </ThemedText>
          ) : (
            <ThemedText type="h3">{value}</ThemedText>
          )}
        </ThemedView>
        <ThemedView
          style={tw`w-12 h-12 rounded-full bg-blue-50 items-center justify-center`}
        >
          <Ionicons name={icon} size={24} color={iconColor} />
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}
