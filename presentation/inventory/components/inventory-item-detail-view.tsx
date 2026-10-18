import { useCallback, useRef, useState } from "react";
import { ScrollView, Pressable, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
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
import DialogModal from "@/presentation/theme/components/dialog-modal";
import ActionsBottomSheet from "@/presentation/theme/components/actions-bottom-sheet";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useInventoryItemDetail } from "@/presentation/inventory/hooks/useInventoryItemDetail";
import AdjustStockModal from "@/presentation/inventory/components/adjust-stock-modal";
import InventoryDetailSummaryCard from "@/presentation/inventory/components/inventory-detail-summary-card";
import InventoryMovementHistory from "@/presentation/inventory/components/inventory-movement-history";
import LinkedProductsList from "@/presentation/inventory/components/linked-products-list";

interface InventoryItemDetailViewProps {
  itemId: string;
  /**
   * Rendered as a pane next to the inventory list (tablet) instead of as its
   * own screen: shows a close button and closes the pane instead of
   * navigating back.
   */
  embedded?: boolean;
  onClose?: () => void;
}

export default function InventoryItemDetailView({
  itemId,
  embedded = false,
  onClose,
}: InventoryItemDetailViewProps) {
  const { t } = useTranslation("inventory");
  const { user } = useAuthStore();
  const canManage = isAdminLevelRole(user?.role?.name);
  const primaryColor = useThemeColor({}, "primary");

  const { item, itemQuery, movements, movementsQuery } =
    useInventoryItemDetail(itemId);
  const { deleteItem, updateItem } = useInventoryItems();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [adjustMode, setAdjustMode] = useState<"restock" | "decrease" | null>(
    null,
  );
  const [refreshing, setRefreshing] = useState(false);
  const optionsSheetRef = useRef<BottomSheetMethods>(null);

  const Container = embedded ? ThemedView : ScreenLayout;
  const close = onClose ?? (() => router.back());

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
      pathname: "/(profile)/inventory/items/form",
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
      pathname: "/(profile)/inventory/items/new-product",
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
    close();
  };

  return (
    <Container style={tw`flex-1 bg-background`}>
      <ThemedView
        style={tw`items-center gap-2 flex-row justify-between px-4 pt-8 pb-2 bg-transparent`}
      >
        <ThemedView
          style={tw`items-center gap-4 flex-row flex-1 bg-transparent`}
        >
          <Pressable
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel={
              embedded ? t("common:actions.close") : t("common:actions.goBack")
            }
            style={({ pressed }) => tw.style(pressed && "opacity-70")}
          >
            <Icon
              name={embedded ? "x" : "arrow-left"} color={tw.color("on-surface")}
              size={24}
            />
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
            <Icon name="ellipsis-vertical" color={tw.color("on-surface")} size={22} />
          </Pressable>
        )}
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 gap-4 pt-2 pb-28`}
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
            <Icon name="circle-alert" size={48} color={tw.color("red-500")} />
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

      {/* Floating Actions — stock movements are open to every role */}
      {item && (
        <View style={tw`absolute bottom-6 left-4 right-4`}>
          <ThemedView
            style={tw`flex-row gap-3 bg-surface rounded-3xl p-2 shadow-sm`}
          >
            <Button
              label={t("decrease")}
              leftIcon="minus"
              variant="secondary"
              onPress={() => setAdjustMode("decrease")}
              style={tw`flex-1`}
            />
            <Button
              label={t("restock")}
              leftIcon="plus"
              variant="primary"
              onPress={() => setAdjustMode("restock")}
              style={tw`flex-1`}
            />
          </ThemedView>
        </View>
      )}

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
                icon: "square-pen",
                label: t("editItem"),
                onPress: handleEditItem,
              },
              {
                icon: "link",
                label: t("detail.linkToProduct"),
                onPress: handleLinkToProduct,
              },
              {
                icon: "power",
                label: item.isActive ? t("deactivateItem") : t("activateItem"),
                onPress: handleToggleActive,
              },
              {
                icon: "trash",
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
    </Container>
  );
}
