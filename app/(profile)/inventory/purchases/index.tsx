import { useState } from "react";
import { router } from "expo-router";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Fab from "@/presentation/theme/components/fab";
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import InventoryPurchasesTab from "@/presentation/inventory/components/inventory-purchases-tab";
import InventorySplitLayout from "@/presentation/inventory/components/inventory-split-layout";
import InventoryPurchaseDetailView from "@/presentation/inventory/components/inventory-purchase-detail-view";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";

export default function MenuInventoryPurchasesScreen() {
  const { t } = useTranslation("inventory");
  // Tablet landscape: the purchase opens in a pane next to the list
  const { isExpanded } = useResponsiveLayout();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = (
    <>
      <ThemedView style={tw`px-4 pt-8 bg-transparent`}>
        <InventoryScreenHeader title={t("purchases.title")} />
      </ThemedView>

      <InventoryPurchasesTab
        activeId={isExpanded ? (selectedId ?? undefined) : undefined}
        onOpenPurchase={
          isExpanded ? (purchase) => setSelectedId(purchase.id) : undefined
        }
      />

      <Fab
        icon="shopping-cart"
        label={t("purchases.register")}
        onPress={() =>
          router.push({ pathname: "/(profile)/inventory/purchases/items" })
        }
      />
    </>
  );

  return (
    <ScreenLayout fullWidth={isExpanded} style={tw`flex-1`}>
      {isExpanded ? (
        <InventorySplitLayout
          list={list}
          emptyIcon="receipt-text"
          emptyText={t("pane.selectPurchase")}
          pane={
            selectedId ? (
              <InventoryPurchaseDetailView
                key={selectedId}
                purchaseId={selectedId}
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
