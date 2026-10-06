import { useRef, useState } from "react";
import { ScrollView, RefreshControl, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetMethods,
  BottomSheetView,
} from "@expo/ui/community/bottom-sheet";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import Button from "@/presentation/theme/components/button";
import Fab from "@/presentation/theme/components/fab";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import TextInput from "@/presentation/theme/components/text-input";
import Chip from "@/presentation/theme/components/chip";
import IconButton from "@/presentation/theme/components/icon-button";
import Card from "@/presentation/theme/components/card";
import ActionsBottomSheet from "@/presentation/theme/components/actions-bottom-sheet";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useInventoryItemsBrowser } from "@/presentation/inventory/hooks/useInventoryItemsBrowser";
import { useInventoryItemCategories } from "@/presentation/inventory/hooks/useInventoryItemCategories";
import AdjustStockModal from "@/presentation/inventory/components/adjust-stock-modal";
import InventoryItemCard from "@/presentation/inventory/components/inventory-item-card";
import InventoryStockSummary from "@/presentation/inventory/components/inventory-stock-summary";
import type { InventoryItem } from "@/core/inventory/models/inventory-item.model";
import { InventoryItemStockStatusFilter } from "@/presentation/inventory/interfaces/dto/find-all-inventory-items.dto";

interface InventoryContentProps {
  onBack?: () => void;
}

export default function InventoryContent({ onBack }: InventoryContentProps) {
  const { t } = useTranslation("inventory");
  const { user } = useAuthStore();
  const canManage = isAdminLevelRole(user?.role?.name);
  const {
    items: catalogItems,
    itemsQuery: catalogQuery,
    deleteItem,
    updateItem,
  } = useInventoryItems();
  const { categories } = useInventoryItemCategories();
  const menuProducts = useMenuStore((state) => state.products);
  const exampleMenuProductName =
    menuProducts.find((product) => product.isActive)?.name ||
    t("addToInventory.menuProductExampleFallback");
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [itemToAdjust, setItemToAdjust] = useState<InventoryItem | null>(null);
  const [itemForOptions, setItemForOptions] = useState<InventoryItem | null>(
    null,
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedStatus, setSelectedStatus] =
    useState<InventoryItemStockStatusFilter | null>(null);
  const optionsSheetRef = useRef<BottomSheetMethods>(null);
  const addSheetRef = useRef<BottomSheetMethods>(null);

  const {
    items: browsedItems,
    itemsQuery: browserQuery,
    hasMore,
    isLoadingMore,
    loadMore,
  } = useInventoryItemsBrowser({
    categoryId: selectedCategoryId,
    status: selectedStatus,
  });

  const handleOpenSearch = () => {
    router.push({ pathname: "/(profile)/menu-inventory-search" });
  };

  const handleOpenAddSelector = () => {
    addSheetRef.current?.present();
  };

  const handleCreateItem = () => {
    addSheetRef.current?.dismiss();
    router.push({ pathname: "/(profile)/menu-inventory-item-form" });
  };

  const handleTrackMenuProduct = () => {
    addSheetRef.current?.dismiss();
    router.push({
      pathname: "/(profile)/menu-inventory-item-new-product",
      params: { mode: "track" },
    });
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
        categoryId: item.category?.id ?? "",
      },
    });
  };

  const handleOpenPurchases = () => {
    router.push({ pathname: "/(profile)/menu-inventory-purchases" });
  };

  const handleOpenCounts = () => {
    router.push({ pathname: "/(profile)/menu-inventory-counts" });
  };

  const handleNewCount = () => {
    addSheetRef.current?.dismiss();
    router.push({ pathname: "/(profile)/menu-inventory-count-items" });
  };

  const handleRegisterPurchase = () => {
    addSheetRef.current?.dismiss();
    router.push({ pathname: "/(profile)/menu-inventory-purchase-items" });
  };

  const handleManageCategories = () => {
    router.push({ pathname: "/(profile)/menu-inventory-categories" });
  };

  const handleCreateCategory = () => {
    router.push({ pathname: "/(profile)/menu-inventory-category-form" });
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    await deleteItem.mutateAsync(itemToDelete.id);
    setItemToDelete(null);
  };

  const handleOpenOptions = (item: InventoryItem) => {
    setItemForOptions(item);
    optionsSheetRef.current?.present();
  };

  const handleToggleActive = async (item: InventoryItem) => {
    optionsSheetRef.current?.dismiss();
    await updateItem.mutateAsync({ id: item.id, isActive: !item.isActive });
  };

  const handleReactivate = (item: InventoryItem) => {
    updateItem.mutate({ id: item.id, isActive: true });
  };

  return (
    <>
      <ThemedView style={tw`px-4 pt-8 gap-4 bg-transparent`}>
        <ThemedView style={tw`items-center gap-3 flex-row bg-transparent`}>
          {onBack && (
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel={t("common:actions.goBack")}
              style={({ pressed }) => tw.style(pressed && "opacity-70")}
            >
              <Ionicons name="arrow-back-outline" size={24} />
            </Pressable>
          )}
          <ThemedText
            type="h3"
            style={{ fontFamily: typography.medium, flex: 1 }}
            numberOfLines={1}
          >
            {t("title")}
          </ThemedText>
          <Pressable
            onPress={handleOpenCounts}
            style={({ pressed }) => tw.style(pressed && "opacity-70")}
            accessibilityLabel={t("counts.history")}
            accessibilityRole="button"
          >
            <Ionicons name="clipboard-outline" size={22} />
          </Pressable>
          {canManage && (
            <Pressable
              onPress={handleOpenPurchases}
              style={({ pressed }) => tw.style(pressed && "opacity-70")}
              accessibilityLabel={t("purchases.history")}
              accessibilityRole="button"
            >
              <Ionicons name="receipt-outline" size={22} />
            </Pressable>
          )}
          {canManage && (
            <Pressable
              onPress={handleManageCategories}
              style={({ pressed }) => tw.style(pressed && "opacity-70")}
              accessibilityLabel={t("categories.title")}
              accessibilityRole="button"
            >
              <Ionicons name="folder-outline" size={22} />
            </Pressable>
          )}
        </ThemedView>

        <Pressable
          onPress={handleOpenSearch}
          accessibilityRole="button"
          accessibilityLabel={t("searchPlaceholder")}
        >
          <TextInput
            placeholder={t("searchPlaceholder")}
            icon="search-outline"
            editable={false}
            pointerEvents="none"
          />
        </Pressable>

        {(categories.length > 0 || canManage) && (
          <ThemedView style={tw`flex-row items-center gap-2 bg-transparent`}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={tw`gap-2 items-center`}
              style={tw`flex-1`}
            >
              <Chip
                label={t("categories.all")}
                selected={selectedCategoryId === null}
                onPress={() => setSelectedCategoryId(null)}
              />
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  selected={selectedCategoryId === category.id}
                  onPress={() =>
                    setSelectedCategoryId((current) =>
                      current === category.id ? null : category.id,
                    )
                  }
                />
              ))}
              {canManage && (
                <IconButton
                  icon="add"
                  variant="outlined"
                  size={18}
                  onPress={handleCreateCategory}
                  style={tw`p-1.5`}
                />
              )}
            </ScrollView>
          </ThemedView>
        )}
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 gap-6 pb-8 pt-6`}
        refreshControl={
          <RefreshControl
            refreshing={browserQuery.isFetching}
            onRefresh={browserQuery.refetch}
            tintColor={tw.color("blue-500")}
            colors={[tw.color("blue-500") || "#3b82f6"]}
          />
        }
      >
        {browserQuery.isLoading && !isLoadingMore && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {t("loading")}
            </ThemedText>
          </ThemedView>
        )}

        {browserQuery.isError && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <ThemedText type="body1" style={tw`text-red-500`}>
              {t("loadError")}
            </ThemedText>
            <Button
              label={t("retry")}
              onPress={() => browserQuery.refetch()}
              variant="outline"
            />
          </ThemedView>
        )}

        {!browserQuery.isLoading &&
          !browserQuery.isError &&
          catalogItems.length === 0 && (
            <ThemedView style={tw`items-center py-8 gap-3`}>
              <Ionicons name="cube-outline" size={48} color="#999" />
              <ThemedText type="body1" style={tw`font-semibold`}>
                {t("empty")}
              </ThemedText>
              <ThemedText
                type="body2"
                style={tw`text-center text-gray-500 px-4`}
              >
                {t("emptyDescription")}
              </ThemedText>
            </ThemedView>
          )}

        {!catalogQuery.isLoading &&
          !catalogQuery.isError &&
          catalogItems.length > 0 && (
            <InventoryStockSummary
              items={catalogItems}
              selectedStatus={selectedStatus}
              onSelectStatus={setSelectedStatus}
            />
          )}

        {!browserQuery.isLoading &&
          !browserQuery.isError &&
          catalogItems.length > 0 &&
          browsedItems.length === 0 && (
            <ThemedView style={tw`items-center py-8 gap-3`}>
              <Ionicons name="search-outline" size={40} color="#999" />
              <ThemedText type="body1" style={tw`font-semibold`}>
                {t("noResults")}
              </ThemedText>
              <ThemedText
                type="body2"
                style={tw`text-center text-gray-500 px-4`}
              >
                {t("noResultsDescription")}
              </ThemedText>
            </ThemedView>
          )}

        {browsedItems.length > 0 && (
          <ThemedView style={tw`gap-3.5 bg-transparent`}>
            {browsedItems.map((item) => (
              <InventoryItemCard
                key={item.id}
                item={item}
                canManage={canManage}
                onPress={(pressedItem) =>
                  router.push({
                    pathname: "/(profile)/menu-inventory-item-detail",
                    params: { itemId: pressedItem.id },
                  })
                }
                onOptionsPress={handleOpenOptions}
                onAdjustPress={setItemToAdjust}
                onReactivatePress={handleReactivate}
              />
            ))}
            {hasMore && (
              <Button
                label={t("common:actions.loadMore")}
                variant="outline"
                loading={isLoadingMore}
                onPress={loadMore}
              />
            )}
          </ThemedView>
        )}
      </ScrollView>

      {canManage && (
        <Fab
          icon="add"
          label={t("createItem")}
          onPress={handleOpenAddSelector}
        />
      )}

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

      <ThemedBottomSheetModal ref={addSheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6`}>
          <ThemedView style={tw`mb-8 mt-4`}>
            <ThemedText type="h3">{t("addToInventory.title")}</ThemedText>
          </ThemedView>

          <ThemedView style={tw`gap-4 `}>
            <Card onPress={handleTrackMenuProduct}>
              <ThemedView
                style={tw`flex-row items-center gap-3 bg-transparent`}
              >
                <Ionicons
                  name="fast-food-outline"
                  size={26}
                  color={tw.color("text-light-on-surface-variant")}
                />
                <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
                  <ThemedText
                    type="body1"
                    style={{ fontFamily: typography.medium }}
                  >
                    {t("addToInventory.menuProduct")}
                  </ThemedText>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {t("addToInventory.menuProductDescription", {
                      product: exampleMenuProductName,
                    })}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </Card>

            <Card onPress={handleCreateItem}>
              <ThemedView
                style={tw`flex-row items-center gap-3 bg-transparent`}
              >
                <Ionicons
                  name="cube-outline"
                  size={26}
                  color={tw.color("text-light-on-surface-variant")}
                />
                <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
                  <ThemedText
                    type="body1"
                    style={{ fontFamily: typography.medium }}
                  >
                    {t("addToInventory.inventoryItem")}
                  </ThemedText>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {t("addToInventory.inventoryItemDescription")}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </Card>

            <Card onPress={handleRegisterPurchase}>
              <ThemedView
                style={tw`flex-row items-center gap-3 bg-transparent`}
              >
                <Ionicons
                  name="cart-outline"
                  size={26}
                  color={tw.color("text-light-on-surface-variant")}
                />
                <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
                  <ThemedText
                    type="body1"
                    style={{ fontFamily: typography.medium }}
                  >
                    {t("purchases.register")}
                  </ThemedText>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {t("purchases.registerDescription")}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </Card>

            <Card onPress={handleNewCount}>
              <ThemedView
                style={tw`flex-row items-center gap-3 bg-transparent`}
              >
                <Ionicons
                  name="clipboard-outline"
                  size={26}
                  color={tw.color("text-light-on-surface-variant")}
                />
                <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
                  <ThemedText
                    type="body1"
                    style={{ fontFamily: typography.medium }}
                  >
                    {t("counts.new")}
                  </ThemedText>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {t("counts.newDescription")}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </Card>
          </ThemedView>
        </BottomSheetView>
      </ThemedBottomSheetModal>

      <ThemedBottomSheetModal ref={optionsSheetRef} enablePanDownToClose>
        {itemForOptions && (
          <ActionsBottomSheet
            title={t("manageItem")}
            subtitle={itemForOptions.name}
            items={[
              {
                icon: "create-outline",
                label: t("editItem"),
                onPress: () => {
                  optionsSheetRef.current?.dismiss();
                  handleEditItem(itemForOptions);
                },
              },
              {
                icon: "power-outline",
                label: itemForOptions.isActive
                  ? t("deactivateItem")
                  : t("activateItem"),
                onPress: () => handleToggleActive(itemForOptions),
              },
              {
                icon: "trash-outline",
                label: t("deleteItem"),
                color: "text-red-600",
                onPress: () => {
                  optionsSheetRef.current?.dismiss();
                  setItemToDelete(itemForOptions);
                },
              },
            ]}
          />
        )}
      </ThemedBottomSheetModal>
    </>
  );
}
