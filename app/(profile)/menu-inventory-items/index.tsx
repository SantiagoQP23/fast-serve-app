import { useState } from "react";
import { ScrollView, RefreshControl, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Fab from "@/presentation/theme/components/fab";
import Label from "@/presentation/theme/components/label";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import SwipeableRow from "@/presentation/theme/components/swipeable-row";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import AdjustStockModal from "@/presentation/inventory/components/adjust-stock-modal";
import type { InventoryItem } from "@/core/inventory/models/inventory-item.model";
import IconButton from "@/presentation/theme/components/icon-button";

export default function MenuInventoryItemsScreen() {
  const { t } = useTranslation("inventory");
  const { user } = useAuthStore();
  const canManage = isAdminLevelRole(user?.role?.name);
  const { items, itemsQuery, deleteItem } = useInventoryItems();
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [itemToAdjust, setItemToAdjust] = useState<InventoryItem | null>(null);

  const handleCreateItem = () => {
    router.push({ pathname: "/(profile)/menu-inventory-item-form" });
  };

  const handleEditItem = (item: InventoryItem) => {
    router.push({
      pathname: "/(profile)/menu-inventory-item-form",
      params: {
        itemId: item.id,
        name: item.name,
        unit: item.unit,
        quantity: String(item.quantity),
        minimumQuantity:
          item.minimumQuantity != null ? String(item.minimumQuantity) : "",
        isActive: String(item.isActive),
      },
    });
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    await deleteItem.mutateAsync(itemToDelete.id);
    setItemToDelete(null);
  };

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
      <ThemedView style={tw`items-center gap-4 flex-row mb-6`}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => tw.style(pressed && "opacity-70")}
        >
          <Ionicons name="arrow-back-outline" size={24} />
        </Pressable>
        <ThemedText
          type="h3"
          style={{ fontFamily: typography.regular }}
          numberOfLines={1}
        >
          {t("title")}
        </ThemedText>
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-4 pb-8`}
        refreshControl={
          <RefreshControl
            refreshing={itemsQuery.isFetching}
            onRefresh={itemsQuery.refetch}
            tintColor={tw.color("blue-500")}
            colors={[tw.color("blue-500") || "#3b82f6"]}
          />
        }
      >
        {itemsQuery.isLoading && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {t("loading")}
            </ThemedText>
          </ThemedView>
        )}

        {itemsQuery.isError && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <ThemedText type="body1" style={tw`text-red-500`}>
              {t("loadError")}
            </ThemedText>
            <Button
              label={t("retry")}
              onPress={() => itemsQuery.refetch()}
              variant="outline"
            />
          </ThemedView>
        )}

        {!itemsQuery.isLoading && !itemsQuery.isError && items.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="cube-outline" size={48} color="#999" />
            <ThemedText type="body1" style={tw`font-semibold`}>
              {t("empty")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {t("emptyDescription")}
            </ThemedText>
          </ThemedView>
        )}

        {items.length > 0 && (
          <ThemedView style={tw`gap-6`}>
            {items.map((item) => (
              <SwipeableRow
                key={item.id}
                onEdit={canManage ? () => handleEditItem(item) : undefined}
                onDelete={canManage ? () => setItemToDelete(item) : undefined}
              >
                <ThemedView style={tw`flex-row items-center justify-between`}>
                  <ThemedView style={tw`gap-1 flex-1`}>
                    <ThemedText
                      type="body1"
                      style={[{ fontFamily: typography.semibold }]}
                    >
                      {item.name}
                    </ThemedText>
                    <ThemedText type="small" style={tw`text-gray-500`}>
                      {t("quantityWithUnit", {
                        quantity: item.quantity,
                        unit: t(`units.${item.unit}`),
                      })}
                      {item.minimumQuantity != null &&
                        ` · ${t("minStock")}: ${item.minimumQuantity}`}
                    </ThemedText>
                  </ThemedView>
                  <ThemedView style={tw`items-end gap-2`}>
                    {/* <Label */}
                    {/*   text={item.isActive ? t("tracked") : t("notTracked")} */}
                    {/*   color={item.isActive ? "success" : "default"} */}
                    {/*   size="small" */}
                    {/* /> */}
                    {canManage && (
                      <IconButton
                        icon="add-outline"
                        onPress={() => setItemToAdjust(item)}
                      />
                    )}
                  </ThemedView>
                </ThemedView>
              </SwipeableRow>
            ))}
          </ThemedView>
        )}
      </ScrollView>

      {canManage && <Fab icon="add" onPress={handleCreateItem} />}

      <DialogModal
        visible={!!itemToDelete}
        title={t("deleteTitle")}
        message={t("deleteMessage")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        loading={deleteItem.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />

      <AdjustStockModal
        item={itemToAdjust}
        onClose={() => setItemToAdjust(null)}
      />
    </ScreenLayout>
  );
}
