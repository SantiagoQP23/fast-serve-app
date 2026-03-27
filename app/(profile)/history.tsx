import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";

export default function HistoryScreen() {
  const { t } = useTranslation("orders");

  return (
    <ScreenLayout style={tw`pt-8 flex-1`}>
      <ThemedView style={tw`flex-1 items-center justify-center gap-4`}>
        <Ionicons name="time-outline" size={80} color={tw.color("gray-400")} />
        <ThemedText type="h3">{t("drawer.history")}</ThemedText>
        <ThemedText type="body2" style={tw`text-center max-w-xs text-gray-500`}>
          Coming soon
        </ThemedText>
      </ThemedView>
    </ScreenLayout>
  );
}
