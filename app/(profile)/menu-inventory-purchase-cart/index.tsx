import { useMemo, useState } from "react";
import { FlatList } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import PurchaseLineCard from "@/presentation/inventory/components/purchase-line-card";
import PurchaseQuantityModal, {
  type PurchaseQuantityTarget,
} from "@/presentation/inventory/components/purchase-quantity-modal";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useCreateInventoryPurchase } from "@/presentation/inventory/hooks/useInventoryPurchases";
import { usePurchaseCartStore } from "@/presentation/inventory/store/purchaseCartStore";
import type { InventoryItem } from "@/core/inventory/models/inventory-item.model";

export default function MenuInventoryPurchaseCartScreen() {
  const { t } = useTranslation("inventory");
  const lines = usePurchaseCartStore((state) => state.lines);
  const note = usePurchaseCartStore((state) => state.note);
  const idempotencyKey = usePurchaseCartStore((state) => state.idempotencyKey);
  const setLine = usePurchaseCartStore((state) => state.setLine);
  const removeLine = usePurchaseCartStore((state) => state.removeLine);
  const setNote = usePurchaseCartStore((state) => state.setNote);
  const reset = usePurchaseCartStore((state) => state.reset);
  const createPurchase = useCreateInventoryPurchase();
  const { items: catalogItems } = useInventoryItems();
  const [target, setTarget] = useState<PurchaseQuantityTarget | null>(null);

  // The cart keeps a snapshot of each item; prefer the catalog's current
  // stock so the before → after preview reflects sales made meanwhile.
  const currentItems = useMemo(
    () => new Map(catalogItems.map((item) => [item.id, item])),
    [catalogItems],
  );
  const currentItem = (item: InventoryItem) =>
    currentItems.get(item.id) ?? item;

  const handleConfirmQuantity = (quantity: number) => {
    if (target) setLine(target.item, quantity);
    setTarget(null);
  };

  const handleAddProduct = () => {
    if (router.canGoBack()) router.back();
    else router.push({ pathname: "/(profile)/menu-inventory-purchase-items" });
  };

  const handleRegister = () => {
    createPurchase.mutate(
      {
        items: lines.map((line) => ({
          inventoryItemId: line.item.id,
          quantity: line.quantity,
        })),
        note: note.trim() || undefined,
        idempotencyKey,
      },
      {
        onSuccess: (purchase) => {
          reset();
          // Drops the item picker under this screen too, so going back from
          // the new purchase lands where the flow started.
          router.dismiss();
          router.replace({
            pathname: "/(profile)/menu-inventory-purchase-detail",
            params: { purchaseId: purchase.id },
          });
        },
      },
    );
  };

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-8 gap-4`}>
      <InventoryScreenHeader title={t("purchases.summaryTitle")} />

      <ThemedText type="small" style={tw`text-gray-500`}>
        {t("purchases.productsCount", { count: lines.length })}
      </ThemedText>

      <FlatList
        style={tw`flex-1`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-4 pb-4`}
        data={lines}
        keyExtractor={(line) => line.item.id}
        renderItem={({ item: line }) => {
          const item = currentItem(line.item);
          return (
            <PurchaseLineCard
              item={item}
              quantity={line.quantity}
              stockPreview={{
                before: item.quantity,
                after: item.quantity + line.quantity,
              }}
              onPress={() =>
                setTarget({
                  item,
                  quantity: line.quantity,
                  baseStock: item.quantity,
                })
              }
              onRemove={() => removeLine(line.item.id)}
            />
          );
        }}
        ListEmptyComponent={
          <ThemedView style={tw`items-center py-12`}>
            <Ionicons
              name="cart-outline"
              size={48}
              color={tw.color("gray-400")}
            />
            <ThemedText type="body1" style={tw`text-gray-500 mt-4 text-center`}>
              {t("purchases.emptyCart")}
            </ThemedText>
          </ThemedView>
        }
        ListFooterComponent={
          <ThemedView style={tw`gap-4 bg-transparent`}>
            <Button
              leftIcon="add-outline"
              label={t("purchases.addProduct")}
              variant="secondary"
              onPress={handleAddProduct}
            />
            <TextInput
              variant="outlined"
              label={t("purchases.noteOptional")}
              placeholder={t("purchases.notePlaceholder")}
              value={note}
              onChangeText={setNote}
              maxLength={255}
            />
          </ThemedView>
        }
      />

      <ThemedView style={tw`pb-2 bg-transparent`}>
        <Button
          leftIcon="checkmark-outline"
          label={t("purchases.confirm")}
          onPress={handleRegister}
          loading={createPurchase.isPending}
          disabled={lines.length === 0 || createPurchase.isPending}
        />
      </ThemedView>

      <PurchaseQuantityModal
        target={target}
        onConfirm={handleConfirmQuantity}
        onClose={() => setTarget(null)}
      />
    </ScreenLayout>
  );
}
