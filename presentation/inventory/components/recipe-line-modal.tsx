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

interface RecipeLineModalProps {
  visible: boolean;
  productOptionId: number;
  productName?: string;
  productOptionName?: string;
  recipeLine: ProductOptionInventoryItem | null;
  onClose: () => void;
}

export default function RecipeLineModal({
  visible,
  productOptionId,
  productName,
  productOptionName,
  recipeLine,
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
            key={recipeLine?.id ?? "new"}
            productOptionId={productOptionId}
            productName={productName}
            productOptionName={productOptionName}
            recipeLine={recipeLine}
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
  onClose: () => void;
}

function RecipeLineForm({
  productOptionId,
  productName,
  productOptionName,
  recipeLine,
  onClose,
}: RecipeLineFormProps) {
  const { t } = useTranslation("inventory");
  const isEditing = !!recipeLine;
  const { items, createItem } = useInventoryItems();
  const { categories, createCategory } = useInventoryItemCategories();
  const { createRecipe, updateRecipe } = useInventoryRecipes(productOptionId);
  const [inventoryItemId, setInventoryItemId] = useState(
    recipeLine?.inventoryItemId ?? "",
  );
  const [quantity, setQuantity] = useState(recipeLine?.quantity ?? 0);
  const [isCreatingNewItem, setIsCreatingNewItem] = useState(false);
  const [newItemName, setNewItemName] = useState(
    [productName, productOptionName].filter(Boolean).join(" "),
  );
  const [newItemUnit, setNewItemUnit] = useState<InventoryUnit>(
    InventoryUnit.UNIT,
  );
  const [newItemCategoryId, setNewItemCategoryId] = useState("");
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const itemOptions = items
    .filter((item) => item.isActive)
    .map((item) => ({ label: item.name, value: item.id }));

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
    createRecipe.isPending ||
    updateRecipe.isPending ||
    createItem.isPending ||
    createCategory.isPending;

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

      let targetCategoryId: string | null = newItemCategoryId
        ? newItemCategoryId
        : null;

      if (isCreatingNewCategory) {
        const trimmedCategoryName = newCategoryName.trim();
        if (!trimmedCategoryName) return;
        const newCategory = await createCategory.mutateAsync({
          name: trimmedCategoryName,
        });
        targetCategoryId = newCategory.id;
      }

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

      {!isEditing && !isCreatingNewItem && (
        <Select
          label={t("recipe.fields.item")}
          options={itemOptions}
          value={inventoryItemId}
          onChange={(v) => setInventoryItemId(String(v))}
          placeholder={t("recipe.placeholders.item")}
          headerAction={{
            label: t("recipe.createNewItem"),
            onPress: () => setIsCreatingNewItem(true),
          }}
        />
      )}

      {!isEditing && isCreatingNewItem && (
        <>
          <View style={tw`flex-row items-center justify-between`}>
            <ThemedText type="body1" style={{ fontFamily: typography.medium }}>
              {t("recipe.newItemTitle")}
            </ThemedText>
            <Button
              label={t("recipe.useExistingItem")}
              variant="text"
              size="small"
              onPress={() => setIsCreatingNewItem(false)}
            />
          </View>

          <TextInput
            bottomSheet
            label={t("recipe.fields.newItemName")}
            value={newItemName}
            onChangeText={setNewItemName}
            placeholder={t("recipe.placeholders.newItemName")}
          />
          <Select
            label={t("fields.unit")}
            options={unitOptions}
            value={newItemUnit}
            onChange={(v) => setNewItemUnit(v as InventoryUnit)}
            placeholder={t("placeholders.unit")}
          />

          {!isCreatingNewCategory && (
            <Select
              label={t("fields.category")}
              options={categoryOptions}
              value={newItemCategoryId}
              onChange={(v) => setNewItemCategoryId(String(v))}
              placeholder={t("placeholders.category")}
              headerAction={{
                label: t("recipe.createNewCategory"),
                onPress: () => setIsCreatingNewCategory(true),
              }}
            />
          )}

          {isCreatingNewCategory && (
            <>
              <View style={tw`flex-row items-center justify-between`}>
                <ThemedText type="body2" style={tw`text-gray-500`}>
                  {t("categories.title")}
                </ThemedText>
                <Button
                  label={t("recipe.useExistingCategory")}
                  variant="text"
                  size="small"
                  onPress={() => setIsCreatingNewCategory(false)}
                />
              </View>
              <TextInput
                bottomSheet
                label={t("categories.fields.name")}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder={t("categories.placeholders.name")}
              />
            </>
          )}
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
              (isCreatingNewItem
                ? !newItemName.trim() ||
                  (isCreatingNewCategory && !newCategoryName.trim())
                : !inventoryItemId))
          }
        />
      </View>
    </>
  );
}
