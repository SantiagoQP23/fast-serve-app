import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import Select from "@/presentation/theme/components/select";
import Counter from "@/presentation/theme/components/counter";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useInventoryItemCategories } from "@/presentation/inventory/hooks/useInventoryItemCategories";
import { useInventoryRecipes } from "@/presentation/inventory/hooks/useInventoryRecipes";
import { InventoryUnit } from "@/core/inventory/models/inventory-item.model";
import type { ProductOptionInventoryItem } from "@/core/inventory/models/inventory-recipe.model";
import CreateCategoryModal from "@/presentation/inventory/components/create-category-modal";

interface RecipeLineModalProps {
  visible: boolean;
  productOptionId: number;
  productName?: string;
  productOptionName?: string;
  recipeLine: ProductOptionInventoryItem | null;
  inventoryItemId?: string;
  onClose: () => void;
}

export default function RecipeLineModal({
  visible,
  productOptionId,
  productName,
  productOptionName,
  recipeLine,
  inventoryItemId,
  onClose,
}: RecipeLineModalProps) {
  const bottomSheetRef = useRef<BottomSheetMethods>(null);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  return (
    <ThemedBottomSheetModal
      ref={bottomSheetRef}
      enablePanDownToClose
      onDismiss={onClose}
    >
      <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
        {visible && (
          <RecipeLineForm
            key={recipeLine?.id ?? inventoryItemId ?? "new"}
            productOptionId={productOptionId}
            productName={productName}
            productOptionName={productOptionName}
            recipeLine={recipeLine}
            inventoryItemId={inventoryItemId}
            onClose={onClose}
          />
        )}
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
}

interface RecipeLineFormProps {
  productOptionId: number;
  productName?: string;
  productOptionName?: string;
  recipeLine: ProductOptionInventoryItem | null;
  inventoryItemId?: string;
  onClose: () => void;
}

function RecipeLineForm({
  productOptionId,
  productName,
  productOptionName,
  recipeLine,
  inventoryItemId,
  onClose,
}: RecipeLineFormProps) {
  const { t } = useTranslation("inventory");
  const isEditing = !!recipeLine;
  const isCreatingNewItem = !isEditing && !inventoryItemId;
  const { items, createItem } = useInventoryItems();
  const { categories } = useInventoryItemCategories();
  const { createRecipe, updateRecipe } = useInventoryRecipes(productOptionId);
  const [quantity, setQuantity] = useState(recipeLine?.quantity ?? 0);
  const [newItemName, setNewItemName] = useState(
    [productName, productOptionName].filter(Boolean).join(" "),
  );
  const [newItemUnit, setNewItemUnit] = useState<InventoryUnit>(
    InventoryUnit.UNIT,
  );
  const [newItemCategoryId, setNewItemCategoryId] = useState("");
  const [isCreateCategoryModalVisible, setIsCreateCategoryModalVisible] =
    useState(false);

  const unitOptions = Object.values(InventoryUnit).map((unit) => ({
    label: t(`units.${unit}`),
    value: unit,
  }));

  const categoryOptions = [
    { label: t("categories.none"), value: "" },
    ...categories.map((category) => ({
      label: category.name,
      value: category.id,
    })),
  ];

  const selectedExistingItem = items.find(
    (item) => item.id === inventoryItemId,
  );
  const activeUnit = recipeLine
    ? recipeLine.inventoryItem?.unit
    : isCreatingNewItem
      ? newItemUnit
      : selectedExistingItem?.unit;
  const quantityStep =
    activeUnit && activeUnit !== InventoryUnit.UNIT ? 0.1 : 1;

  const isPending =
    createRecipe.isPending || updateRecipe.isPending || createItem.isPending;

  const handleSubmit = async () => {
    if (!Number.isFinite(quantity) || quantity < 0.001) return;

    if (isEditing) {
      await updateRecipe.mutateAsync({
        id: recipeLine.id,
        quantity,
      });
      onClose();
      return;
    }

    let targetInventoryItemId = inventoryItemId;

    if (isCreatingNewItem) {
      const trimmedName = newItemName.trim();
      if (!trimmedName) return;

      const targetCategoryId: string | null = newItemCategoryId
        ? newItemCategoryId
        : null;

      const newItem = await createItem.mutateAsync({
        name: trimmedName,
        unit: newItemUnit,
        categoryId: targetCategoryId,
      });
      targetInventoryItemId = newItem.id;
    }

    if (!targetInventoryItemId) return;

    await createRecipe.mutateAsync({
      productOptionId,
      inventoryItemId: targetInventoryItemId,
      quantity,
    });
    onClose();
  };

  return (
    <>
      <ThemedText type="h3" style={{ fontFamily: typography.medium }}>
        {isEditing ? t("recipe.editLine") : t("recipe.addLine")}
      </ThemedText>

      {!isEditing && !isCreatingNewItem && selectedExistingItem && (
        <View style={tw`gap-2`}>
          <ThemedText style={tw`dark:text-gray-300`}>
            {t("recipe.fields.item")}
          </ThemedText>
          <ThemedText type="body1" style={{ fontFamily: typography.medium }}>
            {selectedExistingItem.name}
          </ThemedText>
        </View>
      )}

      {!isEditing && isCreatingNewItem && (
        <>
          <TextInput
            bottomSheet
            label={t("recipe.fields.newItemName")}
            value={newItemName}
            onChangeText={setNewItemName}
            placeholder={t("recipe.placeholders.newItemName")}
            variant="outlined"
          />
          <Select
            label={t("fields.unit")}
            variant="outlined"
            options={unitOptions}
            value={newItemUnit}
            onChange={(v) => setNewItemUnit(v as InventoryUnit)}
            placeholder={t("placeholders.unit")}
          />

          <Select
            label={t("fields.category")}
            options={categoryOptions}
            variant="outlined"
            value={newItemCategoryId}
            onChange={(v) => setNewItemCategoryId(String(v))}
            headerAction={{
              label: t("recipe.createNewCategory"),
              onPress: () => setIsCreateCategoryModalVisible(true),
            }}
          />
        </>
      )}

      <View style={tw`gap-2`}>
        <ThemedText style={tw`dark:text-gray-300`}>
          {t("recipe.fields.quantity")}
        </ThemedText>
        <Counter
          value={quantity}
          onChangeValue={setQuantity}
          step={quantityStep}
          min={0}
          unit={activeUnit ? t(`units.${activeUnit}`) : undefined}
          size="medium"
        />
      </View>

      <View style={tw`flex-row justify-end gap-2`}>
        <Button
          label={t("cancel")}
          onPress={onClose}
          variant="text"
          size="small"
          disabled={isPending}
        />
        <Button
          label={t("confirm")}
          onPress={handleSubmit}
          size="small"
          loading={isPending}
          disabled={
            quantity < 0.001 ||
            (!isEditing &&
              (isCreatingNewItem ? !newItemName.trim() : !inventoryItemId))
          }
        />
      </View>

      <CreateCategoryModal
        visible={isCreateCategoryModalVisible}
        onClose={() => setIsCreateCategoryModalVisible(false)}
        onCreated={(category) => setNewItemCategoryId(category.id)}
      />
    </>
  );
}
