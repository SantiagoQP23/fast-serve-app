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
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useInventoryItemCategories } from "@/presentation/inventory/hooks/useInventoryItemCategories";
import { useInventoryRecipes } from "@/presentation/inventory/hooks/useInventoryRecipes";
import { InventoryUnit } from "@/core/inventory/models/inventory-item.model";
import type { ProductOptionInventoryItem } from "@/core/inventory/models/inventory-recipe.model";

const NEW_ITEM_VALUE = "__new__";

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
  const { categories } = useInventoryItemCategories();
  const { createRecipe, updateRecipe } = useInventoryRecipes(productOptionId);
  const [inventoryItemId, setInventoryItemId] = useState(
    recipeLine?.inventoryItemId ?? "",
  );
  const [quantity, setQuantity] = useState(
    recipeLine ? String(recipeLine.quantity) : "",
  );
  const [newItemName, setNewItemName] = useState(
    [productName, productOptionName].filter(Boolean).join(" "),
  );
  const [newItemUnit, setNewItemUnit] = useState<InventoryUnit>(
    InventoryUnit.UNIT,
  );
  const [newItemCategoryId, setNewItemCategoryId] = useState("");

  const isCreatingNewItem = inventoryItemId === NEW_ITEM_VALUE;

  const itemOptions = [
    { label: t("recipe.createNewItem"), value: NEW_ITEM_VALUE },
    ...items
      .filter((item) => item.isActive)
      .map((item) => ({ label: item.name, value: item.id })),
  ];

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

  const isPending =
    createRecipe.isPending || updateRecipe.isPending || createItem.isPending;

  const handleSubmit = async () => {
    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0.001) return;

    if (isEditing) {
      await updateRecipe.mutateAsync({
        id: recipeLine.id,
        quantity: parsedQuantity,
      });
      onClose();
      return;
    }

    let targetInventoryItemId = inventoryItemId;

    if (isCreatingNewItem) {
      const trimmedName = newItemName.trim();
      if (!trimmedName) return;
      const newItem = await createItem.mutateAsync({
        name: trimmedName,
        unit: newItemUnit,
        categoryId: newItemCategoryId ? newItemCategoryId : null,
      });
      targetInventoryItemId = newItem.id;
    }

    if (!targetInventoryItemId) return;

    await createRecipe.mutateAsync({
      productOptionId,
      inventoryItemId: targetInventoryItemId,
      quantity: parsedQuantity,
    });
    onClose();
  };

  return (
    <>
      <ThemedText type="h3" style={{ fontFamily: typography.medium }}>
        {isEditing ? t("recipe.editLine") : t("recipe.addLine")}
      </ThemedText>

      {!isEditing && (
        <Select
          label={t("recipe.fields.item")}
          options={itemOptions}
          value={inventoryItemId}
          onChange={(v) => setInventoryItemId(String(v))}
          placeholder={t("recipe.placeholders.item")}
        />
      )}

      {!isEditing && isCreatingNewItem && (
        <>
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
          <Select
            label={t("fields.category")}
            options={categoryOptions}
            value={newItemCategoryId}
            onChange={(v) => setNewItemCategoryId(String(v))}
            placeholder={t("placeholders.category")}
          />
        </>
      )}

      <TextInput
        bottomSheet
        label={t("recipe.fields.quantity")}
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="decimal-pad"
        placeholder={t("recipe.placeholders.quantity")}
      />

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
            !quantity ||
            Number(quantity) < 0.001 ||
            (!isEditing &&
              (!inventoryItemId ||
                (isCreatingNewItem && !newItemName.trim())))
          }
        />
      </View>
    </>
  );
}
