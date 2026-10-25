import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "@/presentation/theme/components/icon";
import { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { canManageInventory } from "@/core/auth/models/user.model";
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
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import IconButton from "@/presentation/theme/components/icon-button";
import Skeleton from "@/presentation/theme/components/skeleton";
import { isProductStockItem } from "@/core/inventory/models/inventory-item.model";
import {
  getLineItemId,
  getOwnStockLine,
} from "@/core/inventory/models/inventory-recipe.model";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";

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
  const canManage = canManageInventory(user?.role?.name);
  const primaryColor = useThemeColor({}, "primary");
  const insets = useSafeAreaInsets();

  const { item, itemQuery, movements, movementsQuery } =
    useInventoryItemDetail(itemId);
  const { deleteItem } = useInventoryItems();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [adjustMode, setAdjustMode] = useState<"restock" | "decrease" | null>(
    null,
  );
  const [refreshing, setRefreshing] = useState(false);
  const optionsSheetRef = useRef<BottomSheetMethods>(null);

  // A variant's own stock is shown on that variant (counts, purchases, the
  // shopping list and low-stock alerts can still open it by item id).
  const ownerOptionId = useMenuStore((state) => {
    if (!item || !isProductStockItem(item)) return null;
    for (const product of state.products) {
      for (const option of product.options ?? []) {
        const own = getOwnStockLine(option.inventoryItems);
        if (own && getLineItemId(own) === item.id) return option.id;
      }
    }
    return null;
  });
  useEffect(() => {
    if (embedded || ownerOptionId === null) return;
    router.replace({
      pathname: "/(profile)/menu/products/variant",
      params: { productOptionId: String(ownerOptionId) },
    });
  }, [embedded, ownerOptionId]);

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

  const handleConfirmDelete = async () => {
    if (!item) return;
    try {
      await deleteItem.mutateAsync(item.id);
    } catch {
      // The mutation already shows the error; the dialog stays to retry.
      return;
    }
    setShowDeleteConfirm(false);
    close();
  };

  const linkedCount = item?.productOptions?.length ?? 0;

  return (
    <Container style={tw`flex-1 bg-background`}>
      <ThemedView style={tw`px-4 ${embedded ? "pt-2" : "pt-6"} bg-transparent`}>
        {/* The item's name leads the content, so the header stays bare */}
        <InventoryScreenHeader
          onBack={close}
          backIcon={embedded ? "x" : "arrow-left"}
          right={
            canManage && item ? (
              <IconButton
                icon="ellipsis-vertical"
                onPress={() => optionsSheetRef.current?.present()}
                accessibilityLabel={t("options")}
                style={tw`-mr-3`}
              />
            ) : undefined
          }
        />
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 gap-8 pt-6 pb-10`}
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
          // Same shape as the summary below, so nothing jumps when it loads
          <ThemedView
            style={tw`gap-4 bg-transparent`}
            accessibilityLabel={t("loading")}
          >
            <Skeleton style={tw`h-9 w-3/4`} />
            <Skeleton style={tw`h-5 w-1/3`} />
            <Skeleton style={tw`h-6 w-24 rounded-full`} />
            <Skeleton style={tw`h-12 w-1/2`} />
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
            <InventoryDetailSummaryCard
              item={item}
              onSetMinimum={canManage ? handleEditItem : undefined}
            />

            <LinkedProductsList
              lines={item.productOptions ?? []}
              unit={item.unit}
              onAddPress={canManage ? handleLinkToProduct : undefined}
            />

            <InventoryMovementHistory
              movements={movements}
              unit={item.unit}
              loading={movementsQuery.isLoading}
              error={
                movementsQuery.isError
                  ? t("detail.movementsLoadError")
                  : undefined
              }
            />
          </>
        )}
      </ScrollView>

      {/* Docked like the order and bill bars; stock movements are open to
          every role */}
      {item && (
        <ThemedView
          style={[
            tw`flex-row items-center gap-3 px-4 pt-3 border-t border-divider bg-background`,
            { paddingBottom: embedded ? 16 : Math.max(insets.bottom, 16) },
          ]}
        >
          <Button
            label={t("decrease")}
            leftIcon="minus"
            variant="outline"
            onPress={() => setAdjustMode("decrease")}
            style={tw`flex-1`}
          />
          <Button
            label={t("restock")}
            leftIcon="plus"
            onPress={() => setAdjustMode("restock")}
            style={tw`flex-1`}
          />
        </ThemedView>
      )}

      <AdjustStockModal
        item={adjustMode ? (item ?? null) : null}
        initialMode={adjustMode ?? "restock"}
        onClose={() => setAdjustMode(null)}
      />

      <DialogModal
        visible={showDeleteConfirm}
        title={t("deleteTitle")}
        message={
          linkedCount > 0
            ? t("deleteMessageLinked", {
                name: item?.name ?? "",
                count: linkedCount,
              })
            : t("deleteMessage", { name: item?.name ?? "" })
        }
        confirmLabel={t("delete")}
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
