import { useCallback, useRef, useState } from "react";
import { ScrollView, Pressable, RefreshControl } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import QuickActionButton from "@/presentation/orders/components/quick-action-button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import ActionsBottomSheet from "@/presentation/theme/components/actions-bottom-sheet";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useInventoryItemDetail } from "@/presentation/inventory/hooks/useInventoryItemDetail";
import AdjustStockModal from "@/presentation/inventory/components/adjust-stock-modal";
import InventoryDetailSummaryCard from "@/presentation/inventory/components/inventory-detail-summary-card";
import InventoryMovementHistory from "@/presentation/inventory/components/inventory-movement-history";
import LinkedProductsList from "@/presentation/inventory/components/linked-products-list";

export default function MenuInventoryItemDetailScreen() {
  const { t } = useTranslation("inventory");
  const params = useLocalSearchParams<{ itemId: string }>();
  const { user } = useAuthStore();
  const canManage = isAdminLevelRole(user?.role?.name);
  const primaryColor = useThemeColor({}, "primary");

  const { item, itemQuery, movements, movementsQuery } = useInventoryItemDetail(
    params.itemId,
  );
  const { deleteItem, updateItem } = useInventoryItems();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [adjustMode, setAdjustMode] = useState<"restock" | "waste" | null>(
    null,
  );
  const [refreshing, setRefreshing] = useState(false);
  const optionsSheetRef = useRef<BottomSheetMethods>(null);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([itemQuery.refetch(), movementsQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [itemQuery, movementsQuery]);

  const handleEditItem = () => {
    if (!item) return;
    optionsSheetRef.current?.dismiss();
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
        categoryId: item.category?.id ?? "",
      },
    });
  };

  const handleLinkToProduct = () => {
    if (!item) return;
    optionsSheetRef.current?.dismiss();
    router.push({
      pathname: "/(profile)/menu-inventory-item-new-product",
      params: {
        inventoryItemId: item.id,
        itemName: item.name,
        unit: item.unit,
      },
    });
  };

  const handleToggleActive = async () => {
    if (!item) return;
    optionsSheetRef.current?.dismiss();
    await updateItem.mutateAsync({ id: item.id, isActive: !item.isActive });
  };

  const handleConfirmDelete = async () => {
    if (!item) return;
    await deleteItem.mutateAsync(item.id);
    setShowDeleteConfirm(false);
    router.back();
  };

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ThemedView
        style={tw`items-center gap-2 flex-row justify-between px-4 pt-8 pb-2 bg-transparent`}
      >
        <ThemedView
          style={tw`items-center gap-4 flex-row flex-1 bg-transparent`}
        >
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => tw.style(pressed && "opacity-70")}
          >
            <Ionicons name="arrow-back-outline" size={24} />
          </Pressable>
          <ThemedText
            type="h3"
            style={{ fontFamily: typography.regular, flex: 1 }}
            numberOfLines={1}
          >
            {t("detail.title")}
          </ThemedText>
        </ThemedView>
        {canManage && item && (
          <Pressable
            onPress={() => optionsSheetRef.current?.present()}
            style={({ pressed }) => tw.style(pressed && "opacity-70")}
            accessibilityLabel={t("options")}
            accessibilityRole="button"
          >
            <Ionicons name="ellipsis-vertical-outline" size={22} />
          </Pressable>
        )}
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 gap-4 pb-8 pt-2`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
      >
        {itemQuery.isLoading && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {t("loading")}
            </ThemedText>
          </ThemedView>
        )}

        {itemQuery.isError && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <ThemedText type="body1" style={tw`text-red-500`}>
              {t("detail.loadError")}
            </ThemedText>
            <Button
              label={t("retry")}
              onPress={() => itemQuery.refetch()}
              variant="outline"
            />
          </ThemedView>
        )}

        {item && (
          <>
            <InventoryDetailSummaryCard item={item} />

            {canManage && (
              <ThemedView
                style={tw`flex-row justify-center gap-8 bg-transparent`}
              >
                <QuickActionButton
                  icon="add-outline"
                  label={t("restock")}
                  onPress={() => setAdjustMode("restock")}
                />
                <QuickActionButton
                  icon="remove-outline"
                  label={t("waste")}
                  onPress={() => setAdjustMode("waste")}
                />
              </ThemedView>
            )}

            <LinkedProductsList
              lines={item.productOptions ?? []}
              unit={t(`units.${item.unit}`)}
              onAddPress={canManage ? handleLinkToProduct : undefined}
            />

            <InventoryMovementHistory
              movements={movements}
              unit={t(`units.${item.unit}`)}
            />
            {movementsQuery.isError && (
              <ThemedText type="small" style={tw`text-red-500 text-center`}>
                {t("detail.movementsLoadError")}
              </ThemedText>
            )}
          </>
        )}
      </ScrollView>

      <AdjustStockModal
        item={adjustMode ? (item ?? null) : null}
        initialMode={adjustMode ?? "restock"}
        onClose={() => setAdjustMode(null)}
      />

      <DialogModal
        visible={showDeleteConfirm}
        title={t("deleteTitle")}
        message={t("deleteMessage")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        loading={deleteItem.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ThemedBottomSheetModal ref={optionsSheetRef} enablePanDownToClose>
        {item && (
          <ActionsBottomSheet
            title={t("manageItem")}
            subtitle={item.name}
            items={[
              {
                icon: "create-outline",
                label: t("editItem"),
                onPress: handleEditItem,
              },
              {
                icon: "link-outline",
                label: t("detail.linkToProduct"),
                onPress: handleLinkToProduct,
              },
              {
                icon: "power-outline",
                label: item.isActive ? t("deactivateItem") : t("activateItem"),
                onPress: handleToggleActive,
              },
              {
                icon: "trash-outline",
                label: t("deleteItem"),
                color: "text-red-600",
                onPress: () => {
                  optionsSheetRef.current?.dismiss();
                  setShowDeleteConfirm(true);
                },
              },
            ]}
          />
        )}
      </ThemedBottomSheetModal>
    </ScreenLayout>
  );
}
