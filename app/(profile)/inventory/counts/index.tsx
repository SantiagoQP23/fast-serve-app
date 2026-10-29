import { useState } from "react";
import { router } from "expo-router";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Fab from "@/presentation/theme/components/fab";
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import InventoryCountsTab from "@/presentation/inventory/components/inventory-counts-tab";
import InventorySplitLayout from "@/presentation/inventory/components/inventory-split-layout";
import InventoryCountDetailView from "@/presentation/inventory/components/inventory-count-detail-view";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";

export default function MenuInventoryCountsScreen() {
  const { t } = useTranslation("inventory");
  // Tablet landscape: the count opens in a pane next to the list
  const { isExpanded } = useResponsiveLayout();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = (
    <>
      <ThemedView style={tw`px-4 pt-8 bg-transparent`}>
        <InventoryScreenHeader title={t("counts.title")} />
      </ThemedView>

      <InventoryCountsTab
        activeId={isExpanded ? (selectedId ?? undefined) : undefined}
        onOpenCount={
          isExpanded ? (count) => setSelectedId(count.id) : undefined
        }
      />

      <Fab
        icon="clipboard"
        label={t("counts.new")}
        onPress={() =>
          router.push({ pathname: "/(profile)/inventory/counts/items" })
        }
      />
    </>
  );

  return (
    <ScreenLayout fullWidth={isExpanded} style={tw`flex-1`}>
      {isExpanded ? (
        <InventorySplitLayout
          list={list}
          emptyIcon="clipboard"
          emptyText={t("pane.selectCount")}
          pane={
            selectedId ? (
              <InventoryCountDetailView
                key={selectedId}
                countId={selectedId}
                embedded
                onClose={() => setSelectedId(null)}
              />
            ) : null
          }
        />
      ) : (
        list
      )}
    </ScreenLayout>
  );
}
