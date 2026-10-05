import { RefreshControl, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatDateTime } from "@/core/i18n/utils";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Fab from "@/presentation/theme/components/fab";
import Label from "@/presentation/theme/components/label";
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import { useInventoryPurchases } from "@/presentation/inventory/hooks/useInventoryPurchases";
import {
  getPurchaseCreatorName,
  type InventoryPurchase,
} from "@/core/inventory/models/inventory-purchase.model";

export default function MenuInventoryPurchasesScreen() {
  const { t } = useTranslation("inventory");
  const {
    purchasesQuery,
    purchases,
    hasMore,
    isLoadingMore,
    loadMore,
    refresh,
  } = useInventoryPurchases();

  const openPurchase = (purchase: InventoryPurchase) =>
    router.push({
      pathname: "/(profile)/menu-inventory-purchase-detail",
      params: { purchaseId: purchase.id },
    });

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ThemedView style={tw`px-4 pt-8 bg-transparent`}>
        <InventoryScreenHeader title={t("purchases.title")} />
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 gap-3.5 pb-24 pt-6`}
        refreshControl={
          <RefreshControl
            refreshing={purchasesQuery.isFetching && !isLoadingMore}
            onRefresh={refresh}
          />
        }
      >
        {purchasesQuery.isLoading && !isLoadingMore && (
          <ThemedText type="body1" style={tw`text-gray-500 text-center py-8`}>
            {t("loading")}
          </ThemedText>
        )}

        {purchasesQuery.isError && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <ThemedText type="body1" style={tw`text-red-500`}>
              {t("purchases.loadError")}
            </ThemedText>
            <Button
              label={t("retry")}
              onPress={() => purchasesQuery.refetch()}
              variant="outline"
            />
          </ThemedView>
        )}

        {!purchasesQuery.isLoading &&
          !purchasesQuery.isError &&
          purchases.length === 0 && (
            <ThemedView style={tw`items-center py-8 gap-3`}>
              <Ionicons name="receipt-outline" size={48} color="#999" />
              <ThemedText type="body1" style={tw`font-semibold`}>
                {t("purchases.empty")}
              </ThemedText>
              <ThemedText
                type="body2"
                style={tw`text-center text-gray-500 px-4`}
              >
                {t("purchases.emptyDescription")}
              </ThemedText>
            </ThemedView>
          )}

        {purchases.map((purchase) => {
          const creator = getPurchaseCreatorName(purchase);
          return (
            <Card key={purchase.id} onPress={() => openPurchase(purchase)}>
              <ThemedView style={tw`gap-2 bg-transparent`}>
                <ThemedView
                  style={tw`flex-row justify-between items-center gap-2 bg-transparent`}
                >
                  <ThemedText type="h4" style={tw`flex-1`}>
                    {formatDateTime(purchase.createdAt)}
                  </ThemedText>
                  <Label
                    text={t("purchases.productsCount", {
                      count: purchase.itemsCount ?? 0,
                    })}
                    size="small"
                  />
                </ThemedView>
                {creator && (
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {t("purchases.registeredBy", { name: creator })}
                  </ThemedText>
                )}
                {purchase.note && (
                  <ThemedText type="body2" numberOfLines={2}>
                    {purchase.note}
                  </ThemedText>
                )}
              </ThemedView>
            </Card>
          );
        })}

        {hasMore && (
          <Button
            label={t("common:actions.loadMore")}
            variant="outline"
            loading={isLoadingMore}
            onPress={loadMore}
          />
        )}
      </ScrollView>

      <Fab
        icon="cart-outline"
        label={t("purchases.register")}
        onPress={() =>
          router.push({ pathname: "/(profile)/menu-inventory-purchase-items" })
        }
      />
    </ScreenLayout>
  );
}
