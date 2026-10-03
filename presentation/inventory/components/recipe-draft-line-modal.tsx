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
import InfoTooltip from "@/presentation/theme/components/info-tooltip";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useInventoryItemCategories } from "@/presentation/inventory/hooks/useInventoryItemCategories";
import {
  InventoryUnit,
  type InventoryItem,
} from "@/core/inventory/models/inventory-item.model";
import CreateCategoryModal from "@/presentation/inventory/components/create-category-modal";

interface RecipeDraftLineModalProps {
  visible: boolean;
  mode: "add" | "edit";
  editingName?: string;
  editingUnit?: InventoryUnit;
  editingQuantity?: number;
  excludeInventoryItemIds?: string[];
  preselectedItem?: InventoryItem | null;
  startInCreateMode?: boolean;
  onSubmitQuantity?: (quantity: number) => void;
  onSubmitExistingItem?: (item: InventoryItem, quantity: number) => void;
  onChangeItem?: () => void;
  onClose: () => void;
}

export default function RecipeDraftLineModal({
  visible,
  mode,
  editingName,
  editingUnit,
  editingQuantity,
  excludeInventoryItemIds,
  preselectedItem,
  startInCreateMode,
  onSubmitQuantity,
  onSubmitExistingItem,
  onChangeItem,
  onClose,
}: RecipeDraftLineModalProps) {
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
        {visible && mode === "edit" && (
          <EditQuantityForm
            key="edit"
            name={editingName}
            unit={editingUnit}
            quantity={editingQuantity ?? 0}
            onSubmit={(quantity) => {
              onSubmitQuantity?.(quantity);
              onClose();
            }}
          />
        )}
        {visible && mode === "add" && (
          <AddIngredientForm
            key={preselectedItem?.id ?? (startInCreateMode ? "create" : "add")}
            excludeInventoryItemIds={excludeInventoryItemIds}
            preselectedItem={preselectedItem}
            startInCreateMode={startInCreateMode}
            onSubmitExistingItem={(item, quantity) => {
              onSubmitExistingItem?.(item, quantity);
              onClose();
            }}
            onChangeItem={onChangeItem}
          />
        )}
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
}

interface EditQuantityFormProps {
  name?: string;
  unit?: InventoryUnit;
  quantity: number;
  onSubmit: (quantity: number) => void;
}

function EditQuantityForm({
  name,
  unit,
  quantity,
  onSubmit,
}: EditQuantityFormProps) {
  const { t } = useTranslation("inventory");
  const [value, setValue] = useState(quantity);
  const step = unit && unit !== InventoryUnit.UNIT ? 0.1 : 1;

  const handleSubmit = () => {
    if (value < 0.001) return;
    onSubmit(value);
  };

  return (
    <>
      <ThemedText type="h3">{t("recipe.editLine")}</ThemedText>

      {name && (
        <View style={tw`gap-1`}>
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("recipe.fields.inventoryItem")}
          </ThemedText>
          <ThemedText type="body1" style={{ fontFamily: typography.medium }}>
            {name}
          </ThemedText>
        </View>
      )}

      <View style={tw`gap-2`}>
        <ThemedText type="small" style={tw`text-gray-500`}>
          {t("recipe.fields.usedQuantity")}
        </ThemedText>
        <Counter
          value={value}
          onChangeValue={setValue}
          step={step}
          min={0}
          unit={unit ? t(`units.${unit}`) : undefined}
          size="medium"
        />
      </View>

      <View style={tw`flex-row justify-end gap-2`}>
        <Button
          label={t("confirm")}
          onPress={handleSubmit}
          disabled={value < 0.001}
        />
      </View>
    </>
  );
}

interface AddIngredientFormProps {
  excludeInventoryItemIds?: string[];
  preselectedItem?: InventoryItem | null;
  startInCreateMode?: boolean;
  onSubmitExistingItem: (item: InventoryItem, quantity: number) => void;
  onChangeItem?: () => void;
}

function AddIngredientForm({
  excludeInventoryItemIds,
  preselectedItem,
  startInCreateMode,
  onSubmitExistingItem,
  onChangeItem,
}: AddIngredientFormProps) {
  const { t } = useTranslation("inventory");
  const { items, createItem } = useInventoryItems();
  const { categories } = useInventoryItemCategories();

  const [isCreatingNewItem, setIsCreatingNewItem] =
    useState(!!startInCreateMode);
  const [selectedItemId, setSelectedItemId] = useState(
    preselectedItem?.id ?? "",
  );
  const [quantity, setQuantity] = useState(0);

  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState<InventoryUnit>(
    InventoryUnit.UNIT,
  );
  const [newItemCategoryId, setNewItemCategoryId] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemMinimumQuantity, setNewItemMinimumQuantity] = useState("");
  const [isCreateCategoryModalVisible, setIsCreateCategoryModalVisible] =
    useState(false);

  const excludedIds = new Set(excludeInventoryItemIds ?? []);
  const itemOptions = items
    .filter((item) => item.isActive && !excludedIds.has(item.id))
    .map((item) => ({ label: item.name, value: item.id }));

  const categoryOptions = categories.map((category) => ({
    label: category.name,
    value: category.id,
  }));

  const unitOptions = Object.values(InventoryUnit).map((unit) => ({
    label: t(`units.${unit}`),
    value: unit,
  }));

  const selectedItem =
    items.find((item) => item.id === selectedItemId) ??
    (preselectedItem?.id === selectedItemId ? preselectedItem : undefined);
  const activeUnit = isCreatingNewItem ? newItemUnit : selectedItem?.unit;
  const quantityStep =
    activeUnit && activeUnit !== InventoryUnit.UNIT ? 0.1 : 1;

  const handleSubmit = async () => {
    if (quantity < 0.001) return;

    if (isCreatingNewItem) {
      const trimmedName = newItemName.trim();
      if (!trimmedName) return;

      const parsedItemQuantity = Number(newItemQuantity.replace(",", "."));
      const parsedMinimumQuantity = Number(
        newItemMinimumQuantity.replace(",", "."),
      );

      try {
        const newItem = await createItem.mutateAsync({
          name: trimmedName,
          unit: newItemUnit,
          categoryId: newItemCategoryId || null,
          quantity: Number.isFinite(parsedItemQuantity)
            ? parsedItemQuantity
            : 0,
          minimumQuantity: Number.isFinite(parsedMinimumQuantity)
            ? parsedMinimumQuantity
            : 0,
        });
        onSubmitExistingItem(newItem, quantity);
      } catch {
        // createItem's own mutation already surfaced an error toast.
      }
      return;
    }

    if (!selectedItem) return;
    onSubmitExistingItem(selectedItem, quantity);
  };

  return (
    <>
      <ThemedText type="h2">{t("recipe.addLine")}</ThemedText>

      {!isCreatingNewItem && preselectedItem && (
        <View style={tw`gap-1`}>
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("recipe.fields.inventoryItem")}
          </ThemedText>
          <ThemedText type="body1" style={{ fontFamily: typography.medium }}>
            {preselectedItem.name}
          </ThemedText>
        </View>
      )}

      {!isCreatingNewItem && !preselectedItem && (
        <Select
          label={t("recipe.fields.inventoryItem")}
          options={itemOptions}
          variant="outlined"
          value={selectedItemId}
          onChange={(v) => setSelectedItemId(String(v))}
          headerAction={{
            label: t("recipe.createNewItem"),
            onPress: () => setIsCreatingNewItem(true),
          }}
        />
      )}

      {isCreatingNewItem && (
        <>
          <View style={tw`flex-row gap-2`}>
            <View style={tw`flex-1`}>
              <TextInput
                bottomSheet
                variant="outlined"
                label={t("recipe.fields.newItemName")}
                value={newItemName}
                onChangeText={setNewItemName}
                placeholder={t("recipe.placeholders.newItemName")}
              />
            </View>
            <View style={tw`flex-1`}>
              <Select
                label={t("fields.unit")}
                options={unitOptions}
                variant="outlined"
                value={newItemUnit}
                onChange={(v) => setNewItemUnit(v as InventoryUnit)}
              />
            </View>
          </View>

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

          <View style={tw`flex-row gap-2`}>
            <View style={tw`flex-1`}>
              <TextInput
                bottomSheet
                variant="outlined"
                label={t("wholeProduct.fields.currentQuantity")}
                value={newItemQuantity}
                onChangeText={setNewItemQuantity}
                placeholder={t("placeholders.quantity")}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={tw`flex-1`}>
              <TextInput
                bottomSheet
                variant="outlined"
                label={t("fields.minimumQuantity")}
                value={newItemMinimumQuantity}
                onChangeText={setNewItemMinimumQuantity}
                placeholder={t("placeholders.minimumQuantity")}
                keyboardType="decimal-pad"
                trailingIcon={
                  <InfoTooltip
                    text={t("wholeProduct.fields.minimumQuantityInfo")}
                  />
                }
              />
            </View>
          </View>
        </>
      )}

      <View style={tw`gap-2`}>
        <ThemedText type="small" style={tw`text-gray-500`}>
          {t("recipe.fields.usedQuantity")}
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
        {(preselectedItem || isCreatingNewItem) && onChangeItem && (
          <Button
            label={t("recipe.back")}
            variant="text"
            onPress={onChangeItem}
            disabled={createItem.isPending}
          />
        )}
        <Button
          label={t("confirm")}
          onPress={handleSubmit}
          loading={createItem.isPending}
          disabled={
            createItem.isPending ||
            quantity < 0.001 ||
            (isCreatingNewItem ? !newItemName.trim() : !selectedItemId)
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
