import type { ReactNode } from "react";
import { Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

interface InventoryScreenHeaderProps {
  title: string;
  right?: ReactNode;
}

/** Back arrow + title row used by the inventory stack screens. */
export default function InventoryScreenHeader({
  title,
  right,
}: InventoryScreenHeaderProps) {
  const { t } = useTranslation("inventory");

  return (
    <ThemedView style={tw`items-center gap-3 flex-row bg-transparent`}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t("common:actions.goBack")}
        style={({ pressed }) => tw.style(pressed && "opacity-70")}
      >
        <Ionicons name="arrow-back-outline" size={24} />
      </Pressable>
      <ThemedText
        type="h3"
        style={{ fontFamily: typography.medium, flex: 1 }}
        numberOfLines={1}
      >
        {title}
      </ThemedText>
      {right}
    </ThemedView>
  );
}
