import { router } from "expo-router";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Fab from "@/presentation/theme/components/fab";
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import InventoryCountsTab from "@/presentation/inventory/components/inventory-counts-tab";

export default function MenuInventoryCountsScreen() {
  const { t } = useTranslation("inventory");

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ThemedView style={tw`px-4 pt-8 bg-transparent`}>
        <InventoryScreenHeader title={t("counts.title")} />
      </ThemedView>

      <InventoryCountsTab />

      <Fab
        icon="clipboard-outline"
        label={t("counts.new")}
        onPress={() =>
          router.push({ pathname: "/(profile)/menu-inventory-count-items" })
        }
      />
    </ScreenLayout>
  );
}
