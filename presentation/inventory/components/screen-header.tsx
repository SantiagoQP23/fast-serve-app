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
  /** Defaults to router.back(). */
  onBack?: () => void;
  /** "close" for detail panes next to a list (tablet). */
  backIcon?: "arrow-back-outline" | "close";
  /** Hide the back button, e.g. for a side panel that can't be left. */
  hideBack?: boolean;
}

/** Back arrow + title row used by the inventory stack screens. */
export default function InventoryScreenHeader({
  title,
  right,
  onBack,
  backIcon = "arrow-back-outline",
  hideBack = false,
}: InventoryScreenHeaderProps) {
  const { t } = useTranslation("inventory");

  return (
    <ThemedView style={tw`items-center gap-3 flex-row bg-transparent`}>
      {!hideBack && (
        <Pressable
          onPress={onBack ?? (() => router.back())}
          accessibilityRole="button"
          accessibilityLabel={
            backIcon === "close"
              ? t("common:actions.close")
              : t("common:actions.goBack")
          }
          style={({ pressed }) => tw.style(pressed && "opacity-70")}
        >
          <Ionicons name={backIcon} color={tw.color("on-surface")} size={24} />
        </Pressable>
      )}
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
