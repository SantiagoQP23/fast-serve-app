import { useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { toast } from "sonner-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatDateTime } from "@/core/i18n/utils";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import PurchaseLineCard from "@/presentation/inventory/components/purchase-line-card";
import PurchaseQuantityModal, {
  type PurchaseQuantityTarget,
} from "@/presentation/inventory/components/purchase-quantity-modal";
import { useInventoryPurchase } from "@/presentation/inventory/hooks/useInventoryPurchases";
import {
  getPurchaseCreatorName,
  type InventoryPurchaseItem,
} from "@/core/inventory/models/inventory-purchase.model";

export default function MenuInventoryPurchaseDetailScreen() {
  const { t } = useTranslation("inventory");
  const { purchaseId } = useLocalSearchParams<{ purchaseId: string }>();
  const { purchase, purchaseQuery, updateItem, removeItem } =
    useInventoryPurchase(purchaseId);
  const [lineToEdit, setLineToEdit] = useState<InventoryPurchaseItem | null>(
    null,
  );
  const [lineToRemove, setLineToRemove] =
    useState<InventoryPurchaseItem | null>(null);

  const lines = purchase?.items ?? [];
  const creator = purchase ? getPurchaseCreatorName(purchase) : null;

  // The item's stock already includes this line, so the preview starts
  // from the stock it would have without it.
  const editTarget: PurchaseQuantityTarget | null = lineToEdit
    ? {
        item: lineToEdit.inventoryItem,
        quantity: lineToEdit.quantity,
        baseStock: lineToEdit.inventoryItem.quantity - lineToEdit.quantity,
      }
    : null;

  const handleConfirmEdit = async (quantity: number) => {
    if (!lineToEdit) return;
    if (quantity !== lineToEdit.quantity) {
      try {
        await updateItem.mutateAsync({ itemId: lineToEdit.id, quantity });
      } catch {
        return; // useInventoryPurchase already shows the error toast
      }
    }
    setLineToEdit(null);
  };

  const handleRequestRemove = (line: InventoryPurchaseItem) => {
    if (lines.length <= 1) {
      toast.error(t("purchases.lastItemError"));
      return;
    }
    setLineToRemove(line);
  };

  const handleConfirmRemove = async () => {
    if (!lineToRemove) return;
    try {
      await removeItem.mutateAsync(lineToRemove.id);
    } catch {
      // useInventoryPurchase already shows the error toast
    }
    setLineToRemove(null);
  };

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ThemedView style={tw`px-4 pt-8 bg-transparent`}>
        <InventoryScreenHeader title={t("purchases.detailTitle")} />
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 gap-4 pb-8 pt-6`}
        refreshControl={
          <RefreshControl
            refreshing={purchaseQuery.isRefetching}
            onRefresh={purchaseQuery.refetch}
          />
        }
      >
        {purchaseQuery.isLoading && (
          <ThemedText type="body1" style={tw`text-gray-500 text-center py-8`}>
            {t("loading")}
          </ThemedText>
        )}

        {purchaseQuery.isError && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <ThemedText type="body1" style={tw`text-red-500`}>
              {t("purchases.notFound")}
            </ThemedText>
            <Button
              label={t("retry")}
              onPress={() => purchaseQuery.refetch()}
              variant="outline"
            />
          </ThemedView>
        )}

        {purchase && (
          <>
            <Card>
              <ThemedView style={tw`gap-2 bg-transparent`}>
                <ThemedText type="h4">
                  {formatDateTime(purchase.createdAt)}
                </ThemedText>
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {t("purchases.productsCount", { count: lines.length })}
                </ThemedText>
                {creator && (
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {t("purchases.registeredBy", { name: creator })}
                  </ThemedText>
                )}
                {purchase.note && (
                  <ThemedText type="body2">{purchase.note}</ThemedText>
                )}
              </ThemedView>
            </Card>

            <ThemedText type="small" style={tw`text-gray-500 px-1`}>
              {t("purchases.editHint")}
            </ThemedText>

            {lines.map((line) => (
              <PurchaseLineCard
                key={line.id}
                item={line.inventoryItem}
                quantity={line.quantity}
                onPress={() => setLineToEdit(line)}
                onRemove={() => handleRequestRemove(line)}
              />
            ))}
          </>
        )}
      </ScrollView>

      <PurchaseQuantityModal
        target={editTarget}
        loading={updateItem.isPending}
        onConfirm={handleConfirmEdit}
        onClose={() => setLineToEdit(null)}
      />

      <DialogModal
        visible={!!lineToRemove}
        title={t("purchases.removeItemTitle")}
        message={
          lineToRemove
            ? t("purchases.removeItemMessage", {
                quantity: lineToRemove.quantity,
                unit: t(`units.${lineToRemove.inventoryItem.unit}`),
                name: lineToRemove.inventoryItem.name,
              })
            : ""
        }
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        loading={removeItem.isPending}
        onConfirm={handleConfirmRemove}
        onCancel={() => setLineToRemove(null)}
      />
    </ScreenLayout>
  );
}
