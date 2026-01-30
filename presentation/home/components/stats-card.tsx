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
  loading = false,
}: StatsCardProps) {
  return (
    <ThemedView style={tw`flex-1 rounded-2xl  p-4 border border-light-border`}>
      <ThemedView
        style={tw`flex-row items-center justify-between bg-transparent gap-2`}
      >
        <ThemedView
          style={tw`w-10 h-10 rounded-lg bg-light-surface items-center justify-center`}
        >
          <Ionicons name={icon} size={24} color={tw.color(`black`)} />
        </ThemedView>
        <ThemedView style={tw`flex-1 bg-transparent`}>
          <ThemedText
            type="body2"
            style={tw` mb-1 font-semibold text-gray-500`}
          >
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
      </ThemedView>
    </ThemedView>
  );
}
