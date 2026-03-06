import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

export default function SalesScreen() {
  const { t } = useTranslation("common");

  return (
    <ThemedView style={tw`flex-1 pt-8`}>
      <ThemedView style={tw`px-4 mb-4`}>
        <ThemedText type="h2">{t("navigation.sales")}</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}
