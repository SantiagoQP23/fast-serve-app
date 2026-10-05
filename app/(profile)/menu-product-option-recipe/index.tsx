import { useEffect, useRef, useState } from "react";
import { ScrollView, RefreshControl, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { toast } from "sonner-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import SwipeableRow from "@/presentation/theme/components/swipeable-row";
import { queryClient } from "@/app/_layout";
import { useInventoryRecipes } from "@/presentation/inventory/hooks/useInventoryRecipes";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import RecipeDraftLineModal from "@/presentation/inventory/components/recipe-draft-line-modal";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";
import type { InventoryItem } from "@/core/inventory/models/inventory-item.model";

type DraftLine =
  | {
      draftId: string;
      kind: "existingLine";
      recipeId: string;
      inventoryItemId: string;
      inventoryItem: InventoryItem;
      quantity: number;
      originalQuantity: number;
    }
  | {
      draftId: string;
      kind: "newLink";
      inventoryItemId: string;
      inventoryItem: InventoryItem;
      quantity: number;
    };

const getDraftLineName = (line: DraftLine) => line.inventoryItem.name;

const getDraftLineUnit = (line: DraftLine) => line.inventoryItem.unit;

export default function MenuProductOptionRecipeScreen() {
  const { t } = useTranslation("inventory");
  const params = useLocalSearchParams<{
    productOptionId: string;
    productOptionName?: string;
    productName?: string;
  }>();
  const productOptionId = Number(params.productOptionId);
  const { user } = useAuthStore();
  const canManage = isAdminLevelRole(user?.role?.name);
  const { recipes, recipesQuery, createRecipe, updateRecipe, deleteRecipe } =
    useInventoryRecipes(productOptionId);
  const { items } = useInventoryItems();

  const [draftLines, setDraftLines] = useState<DraftLine[] | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current && recipesQuery.data) {
      setDraftLines(
        recipesQuery.data
          .filter((line) => !!line.inventoryItem)
          .map((line) => ({
            draftId: line.id,
            kind: "existingLine" as const,
            recipeId: line.id,
            inventoryItemId: line.inventoryItemId,
            inventoryItem: line.inventoryItem!,
            quantity: line.quantity,
            originalQuantity: line.quantity,
          })),
      );
      initializedRef.current = true;
    }
  }, [recipesQuery.data]);

  const lines = draftLines ?? [];

  const [lineToDelete, setLineToDelete] = useState<DraftLine | null>(null);
  const [lineToEdit, setLineToEdit] = useState<DraftLine | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [preselectedItem, setPreselectedItem] = useState<InventoryItem | null>(
    null,
  );
  const [startInCreateMode, setStartInCreateMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const itemPickerRef = useRef<BottomSheetPickerRef>(null);

  const linkedInventoryItemIds = lines.map((line) => line.inventoryItemId);

  const itemOptions = items
    .filter(
      (item) => item.isActive && !linkedInventoryItemIds.includes(item.id),
    )
    .map((item) => ({ label: item.name, value: item.id }));

  const openItemPicker = () => itemPickerRef.current?.present();

  const handlePickExistingItem = (value: string | number) => {
    const item = items.find((i) => i.id === String(value));
    if (!item) return;
    setPreselectedItem(item);
    setStartInCreateMode(false);
    setShowAddModal(true);
  };

  const handleCreateNewItem = () => {
    setPreselectedItem(null);
    setStartInCreateMode(true);
    setShowAddModal(true);
  };

  const closeLineModal = () => {
    setShowAddModal(false);
    setLineToEdit(null);
    setPreselectedItem(null);
    setStartInCreateMode(false);
  };

  const handleChangeItem = () => {
    closeLineModal();
    openItemPicker();
  };

  const handleRemoveLine = (line: DraftLine) => {
    setDraftLines((prev) =>
      (prev ?? []).filter((l) => l.draftId !== line.draftId),
    );
    setLineToDelete(null);
  };

  const handleAddExistingItem = (item: InventoryItem, quantity: number) => {
    setDraftLines((prev) => [
      ...(prev ?? []),
      {
        draftId: `draft-${Date.now()}-${Math.random()}`,
        kind: "newLink",
        inventoryItemId: item.id,
        inventoryItem: item,
        quantity,
      },
    ]);
  };

  const handleEditQuantity = (quantity: number) => {
    if (!lineToEdit) return;
    setDraftLines((prev) =>
      (prev ?? []).map((l) =>
        l.draftId === lineToEdit.draftId ? { ...l, quantity } : l,
      ),
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const keptRecipeIds = new Set(
        lines
          .filter(
            (l): l is DraftLine & { kind: "existingLine" } =>
              l.kind === "existingLine",
          )
          .map((l) => l.recipeId),
      );
      const toDelete = recipes.filter((line) => !keptRecipeIds.has(line.id));
      const toUpdate = lines.filter(
        (l): l is DraftLine & { kind: "existingLine" } =>
          l.kind === "existingLine" && l.quantity !== l.originalQuantity,
      );
      const toCreateLinks = lines.filter(
        (l): l is DraftLine & { kind: "newLink" } => l.kind === "newLink",
      );

      await Promise.all([
        ...toDelete.map((line) =>
          deleteRecipe.mutateAsync({ id: line.id, silent: true }),
        ),
        ...toUpdate.map((line) =>
          updateRecipe.mutateAsync({
            id: line.recipeId,
            quantity: line.quantity,
            silent: true,
          }),
        ),
        ...toCreateLinks.map((line) =>
          createRecipe.mutateAsync({
            productOptionId,
            inventoryItemId: line.inventoryItemId,
            quantity: line.quantity,
            silent: true,
          }),
        ),
      ]);

      queryClient.invalidateQueries({ queryKey: ["menu"] });
      router.back();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("recipe.saveError"),
      );
    } finally {
      setIsSaving(false);
    }
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
        {(params.productName || params.productOptionName) && (
          <ThemedView style={tw`gap-0.5`}>
            {params.productName && (
              <ThemedText type="h3" numberOfLines={1}>
                {params.productName}
              </ThemedText>
            )}
            {params.productOptionName && (
              <ThemedText
                type="small"
                style={tw`text-gray-500`}
                numberOfLines={1}
              >
                {params.productOptionName}
              </ThemedText>
            )}
          </ThemedView>
        )}
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-4 pb-8`}
        refreshControl={
          <RefreshControl
            refreshing={recipesQuery.isFetching}
            onRefresh={recipesQuery.refetch}
            tintColor={tw.color("blue-500")}
            colors={[tw.color("blue-500") || "#3b82f6"]}
          />
        }
      >
        <ThemedView style={tw`gap-1`}>
          <ThemedText type="h4" style={tw`text-gray-700`}>
            {t("recipe.configureQuestion")}
          </ThemedText>
        </ThemedView>

        {recipesQuery.isLoading && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {t("loading")}
            </ThemedText>
          </ThemedView>
        )}

        {recipesQuery.isError && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <ThemedText type="body1" style={tw`text-red-500`}>
              {t("loadError")}
            </ThemedText>
            <Button
              label={t("retry")}
              onPress={() => recipesQuery.refetch()}
              variant="outline"
            />
          </ThemedView>
        )}

        {!recipesQuery.isLoading &&
          !recipesQuery.isError &&
          lines.length === 0 && (
            <ThemedView style={tw`items-center py-8 gap-3`}>
              <Ionicons name="restaurant-outline" size={48} color="#999" />
              <ThemedText type="body1" style={tw`font-semibold`}>
                {t("recipe.empty")}
              </ThemedText>
              <ThemedText
                type="body2"
                style={tw`text-center text-gray-500 px-4`}
              >
                {t("recipe.emptyDescription")}
              </ThemedText>
            </ThemedView>
          )}

        {lines.length > 0 && (
          <ThemedView>
            {lines.map((line, index) => {
              const isLast = index === lines.length - 1;

              return (
                <SwipeableRow
                  key={line.draftId}
                  onDelete={canManage ? () => setLineToDelete(line) : undefined}
                >
                  <Pressable
                    disabled={!canManage}
                    onPress={canManage ? () => setLineToEdit(line) : undefined}
                    style={({ pressed }) => [
                      tw`flex-row items-center justify-between py-4`,
                      !isLast && tw`border-b border-light-divider`,
                      pressed && canManage && tw`opacity-60`,
                    ]}
                  >
                    <ThemedText type="body1" style={tw`flex-1`}>
                      {getDraftLineName(line)}
                    </ThemedText>
                    <ThemedView style={tw`flex-row items-center gap-2`}>
                      <ThemedText type="body2" style={tw`text-gray-500`}>
                        {t("quantityWithUnit", {
                          quantity: line.quantity,
                          unit: t(`units.${getDraftLineUnit(line)}`),
                        })}
                      </ThemedText>
                      {canManage && (
                        <Ionicons
                          name="create-outline"
                          size={18}
                          color={tw.color("gray-400")}
                        />
                      )}
                    </ThemedView>
                  </Pressable>
                </SwipeableRow>
              );
            })}
          </ThemedView>
        )}

        {canManage && (
          <Button
            label={t("recipe.addLine")}
            leftIcon="add-outline"
            variant="outline"
            onPress={openItemPicker}
          />
        )}
      </ScrollView>

      {canManage && (
        <Button
          label={t("save")}
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving || lines.length === 0}
        />
      )}

      <DialogModal
        visible={!!lineToDelete}
        title={t("recipe.deleteTitle")}
        message={t("recipe.deleteMessage")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        onConfirm={() => lineToDelete && handleRemoveLine(lineToDelete)}
        onCancel={() => setLineToDelete(null)}
      />

      <BottomSheetPicker
        ref={itemPickerRef}
        title={t("recipe.fields.inventoryItem")}
        options={itemOptions}
        onChange={handlePickExistingItem}
        headerAction={{
          label: t("recipe.createNewItem"),
          onPress: handleCreateNewItem,
        }}
      />

      <RecipeDraftLineModal
        visible={showAddModal || !!lineToEdit}
        mode={lineToEdit ? "edit" : "add"}
        editingName={lineToEdit ? getDraftLineName(lineToEdit) : undefined}
        editingUnit={lineToEdit ? getDraftLineUnit(lineToEdit) : undefined}
        editingQuantity={lineToEdit?.quantity}
        excludeInventoryItemIds={linkedInventoryItemIds}
        preselectedItem={preselectedItem}
        startInCreateMode={startInCreateMode}
        onSubmitQuantity={handleEditQuantity}
        onSubmitExistingItem={handleAddExistingItem}
        onChangeItem={handleChangeItem}
        onClose={closeLineModal}
      />
    </ScreenLayout>
  );
}
