import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
  BottomSheetScrollView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import TextInput from "@/presentation/theme/components/text-input";
import Button from "@/presentation/theme/components/button";
import Switch from "@/presentation/theme/components/switch";
import Checkbox from "@/presentation/theme/components/checkbox";
import InfoRow from "@/presentation/theme/components/info-row";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";
import { parseAmount } from "@/presentation/menu-management/components/modifier-option-sheet";
import {
  InventoryUnit,
  isProductStockItem,
  type InventoryItem,
} from "@/core/inventory/models/inventory-item.model";

/** One ingredient while the recipe is edited: amounts kept as typed. */
export interface RecipeIngredientDraft {
  inventoryItemId: string;
  inventoryItem: InventoryItem;
  removable: boolean;
  /** Shown positive ("0.50"); saved as a negative change. */
  discount: string;
  /** Variant id → amount as typed; absent: the variant doesn't use it. */
  quantities: Record<number, string>;
}

export interface RecipeVariant {
  id: number;
  name: string;
}

export type RecipeIngredientSheetRef = {
  /** Opens with an ingredient to edit, or empty to add one. */
  present: (ingredient?: RecipeIngredientDraft) => void;
  dismiss: () => void;
};

interface RecipeIngredientSheetProps {
  variants: RecipeVariant[];
  items: InventoryItem[];
  /** Insumos already in the recipe: not offered again when adding. */
  usedItemIds: string[];
  /** Only owners and admins change what can be removed (it changes prices). */
  canSetRemovals: boolean;
  onSubmit: (ingredient: RecipeIngredientDraft, isNew: boolean) => void;
  onRemove: (ingredient: RecipeIngredientDraft) => void;
  /** Creates an insumo from the sheet; resolves with it. */
  onCreateItem: (input: {
    name: string;
    unit: InventoryUnit;
    isUnlimited: boolean;
  }) => Promise<InventoryItem>;
}

type FieldErrors = Partial<
  Record<"item" | "quantities" | "discount" | "name", string>
>;

const UNITS = Object.values(InventoryUnit);

/**
 * Adds or edits one ingredient of a product's recipe: the insumo, how much
 * of it each variant uses, and whether the customer can ask for the dish
 * without it (plans/unificar-receta-incluidos.md). Changes stay on the
 * recipe screen until it saves.
 */
const RecipeIngredientSheet = forwardRef<
  RecipeIngredientSheetRef,
  RecipeIngredientSheetProps
>(
  (
    {
      variants,
      items,
      usedItemIds,
      canSetRemovals,
      onSubmit,
      onRemove,
      onCreateItem,
    },
    ref,
  ) => {
    const { t } = useTranslation(["inventory", "common"]);
    const sheetRef = useRef<BottomSheetMethods>(null);
    const itemPickerRef = useRef<BottomSheetPickerRef>(null);
    const unitPickerRef = useRef<BottomSheetPickerRef>(null);
    const [draft, setDraft] = useState<RecipeIngredientDraft | null>(null);
    const [isNew, setIsNew] = useState(true);
    const [errors, setErrors] = useState<FieldErrors>({});
    // "Crear insumo" inside the sheet.
    const [creating, setCreating] = useState(false);
    const [newItem, setNewItem] = useState({
      name: "",
      unit: InventoryUnit.UNIT,
      isUnlimited: false,
    });
    const [isCreatingItem, setIsCreatingItem] = useState(false);
    const multiVariant = variants.length > 1;

    const allVariants = () =>
      Object.fromEntries(variants.map((variant) => [variant.id, ""]));

    useImperativeHandle(ref, () => ({
      present: (ingredient) => {
        setDraft(ingredient ?? null);
        setIsNew(!ingredient);
        setErrors({});
        setCreating(false);
        sheetRef.current?.present();
        if (!ingredient)
          // Adding starts by picking the insumo.
          setTimeout(() => itemPickerRef.current?.present(), 250);
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const pickItem = (item: InventoryItem) => {
      setDraft((current) => ({
        inventoryItemId: item.id,
        inventoryItem: item,
        removable: current?.removable ?? false,
        discount: current?.discount ?? "",
        quantities: current?.quantities ?? allVariants(),
      }));
      setErrors({});
      setCreating(false);
    };

    const update = (change: Partial<RecipeIngredientDraft>) => {
      setDraft((current) => (current ? { ...current, ...change } : current));
      setErrors({});
    };

    const setQuantity = (variantId: number, value: string | null) => {
      if (!draft) return;
      const quantities = { ...draft.quantities };
      if (value === null) delete quantities[variantId];
      else quantities[variantId] = value;
      update({ quantities });
    };

    const sameForAll = () => {
      if (!draft) return;
      const first = variants
        .map((variant) => draft.quantities[variant.id])
        .find((value) => value !== undefined && value !== "");
      if (first === undefined) return;
      update({
        quantities: Object.fromEntries(
          variants.map((variant) => [variant.id, first]),
        ),
      });
    };

    const unlimited = !!draft?.inventoryItem.isUnlimited;

    const handleSubmit = () => {
      if (!draft) {
        setErrors({ item: t("productRecipe.errors.item") });
        return;
      }
      const next: FieldErrors = {};
      const used = variants.filter(
        (variant) => draft.quantities[variant.id] !== undefined,
      );
      if (!used.length) next.quantities = t("productRecipe.errors.noVariant");
      const badAmount = used.some((variant) => {
        const raw = draft.quantities[variant.id].trim();
        if (raw === "") return !unlimited;
        return !(parseAmount(raw) > 0);
      });
      if (badAmount) next.quantities = t("productRecipe.errors.quantity");
      const discount =
        draft.discount.trim() === "" ? 0 : parseAmount(draft.discount);
      if (draft.removable && !(discount >= 0))
        next.discount = t("productRecipe.errors.discount");
      if (Object.keys(next).length) {
        setErrors(next);
        return;
      }
      onSubmit(
        {
          ...draft,
          discount: draft.removable && discount > 0 ? String(discount) : "",
        },
        isNew,
      );
      sheetRef.current?.dismiss();
    };

    const handleCreateItem = async () => {
      if (newItem.name.trim().length < 2) {
        setErrors({ name: t("productRecipe.errors.itemName") });
        return;
      }
      try {
        setIsCreatingItem(true);
        const item = await onCreateItem({
          ...newItem,
          name: newItem.name.trim(),
        });
        pickItem(item);
      } catch {
        // The mutation shows the error.
      } finally {
        setIsCreatingItem(false);
      }
    };

    const itemOptions = items
      .filter(
        (item) =>
          item.isActive &&
          !isProductStockItem(item) &&
          (item.id === draft?.inventoryItemId ||
            !usedItemIds.includes(item.id)),
      )
      .map((item) => ({
        label: item.name,
        value: item.id,
        description: item.isUnlimited
          ? t("unlimited.label")
          : t(`units.${item.unit}`),
      }));

    const unitLabel = draft ? t(`units.${draft.inventoryItem.unit}`) : "";

    return (
      <>
        <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
          <BottomSheetScrollView
            contentContainerStyle={tw`px-4 pb-8 pt-2 gap-4`}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedText type="h3">
              {creating
                ? t("productRecipe.newItem")
                : isNew
                  ? t("productRecipe.addIngredient")
                  : t("productRecipe.editIngredient")}
            </ThemedText>

            {creating ? (
              <>
                <TextInput
                  bottomSheet
                  label={t("productRecipe.fields.itemName")}
                  value={newItem.name}
                  onChangeText={(name) =>
                    setNewItem((current) => ({ ...current, name }))
                  }
                  error={errors.name}
                  maxLength={100}
                  autoFocus
                />
                <InfoRow
                  label={t("productRecipe.fields.unit")}
                  value={t(`units.${newItem.unit}`)}
                  onPress={() => unitPickerRef.current?.present()}
                />
                <ThemedView style={tw`gap-1 bg-transparent`}>
                  <Switch
                    label={t("unlimited.label")}
                    value={newItem.isUnlimited}
                    onValueChange={(isUnlimited) =>
                      setNewItem((current) => ({ ...current, isUnlimited }))
                    }
                  />
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {t("unlimited.hint")}
                  </ThemedText>
                </ThemedView>
                <Button
                  label={t("productRecipe.createItem")}
                  onPress={handleCreateItem}
                  loading={isCreatingItem}
                  disabled={isCreatingItem}
                />
                <ThemedView style={tw`items-center bg-transparent`}>
                  <Button
                    label={t("common:actions.cancel")}
                    variant="text"
                    size="small"
                    onPress={() => setCreating(false)}
                  />
                </ThemedView>
              </>
            ) : (
              <>
                <InfoRow
                  label={t("productRecipe.fields.item")}
                  value={draft?.inventoryItem.name}
                  placeholder={t("productRecipe.fields.pickItem")}
                  onPress={() => itemPickerRef.current?.present()}
                />
                {errors.item && (
                  <ThemedText type="small" style={tw`text-red-500`}>
                    {errors.item}
                  </ThemedText>
                )}

                {draft && (
                  <ThemedView style={tw`gap-2 bg-transparent`}>
                    <ThemedText
                      type="body2"
                      style={tw`text-gray-500 font-semibold`}
                    >
                      {multiVariant
                        ? t("productRecipe.fields.quantityPerVariant", {
                            unit: unitLabel,
                          })
                        : t("productRecipe.fields.quantity", {
                            unit: unitLabel,
                          })}
                    </ThemedText>
                    {unlimited && (
                      <ThemedText type="small" style={tw`text-gray-500`}>
                        {t("productRecipe.unlimitedQuantityHint")}
                      </ThemedText>
                    )}
                    {variants.map((variant) => {
                      const used = draft.quantities[variant.id] !== undefined;
                      return (
                        <ThemedView
                          key={variant.id}
                          style={tw`flex-row items-center gap-3 bg-transparent`}
                        >
                          {multiVariant ? (
                            <ThemedView style={tw`flex-1 bg-transparent`}>
                              <Checkbox
                                label={variant.name}
                                value={used}
                                onValueChange={(checked) =>
                                  setQuantity(variant.id, checked ? "" : null)
                                }
                              />
                            </ThemedView>
                          ) : null}
                          <TextInput
                            bottomSheet
                            containerStyle={
                              multiVariant ? tw`w-32` : tw`flex-1`
                            }
                            label={multiVariant ? undefined : unitLabel}
                            placeholder={
                              used
                                ? unlimited
                                  ? t("productRecipe.noAmount")
                                  : "0"
                                : t("productRecipe.notUsed")
                            }
                            editable={used || !multiVariant}
                            value={draft.quantities[variant.id] ?? ""}
                            onChangeText={(value) =>
                              setQuantity(variant.id, value)
                            }
                            keyboardType="decimal-pad"
                          />
                        </ThemedView>
                      );
                    })}
                    {errors.quantities && (
                      <ThemedText type="small" style={tw`text-red-500`}>
                        {errors.quantities}
                      </ThemedText>
                    )}
                    {multiVariant && (
                      <ThemedView style={tw`flex-row bg-transparent`}>
                        <Button
                          label={t("productRecipe.sameForAll")}
                          variant="text"
                          size="small"
                          onPress={sameForAll}
                        />
                      </ThemedView>
                    )}
                  </ThemedView>
                )}

                {draft && (
                  <ThemedView style={tw`gap-1 bg-transparent`}>
                    <Switch
                      label={t("productRecipe.fields.removable")}
                      value={draft.removable}
                      disabled={!canSetRemovals}
                      onValueChange={(removable) => update({ removable })}
                    />
                    <ThemedText type="small" style={tw`text-gray-500`}>
                      {canSetRemovals
                        ? t("productRecipe.removableHint", {
                            name: draft.inventoryItem.name,
                          })
                        : t("productRecipe.removableAdminOnly")}
                    </ThemedText>
                  </ThemedView>
                )}
                {draft?.removable && (
                  <TextInput
                    bottomSheet
                    label={t("productRecipe.fields.discount")}
                    placeholder="0"
                    value={draft.discount}
                    editable={canSetRemovals}
                    onChangeText={(discount) => update({ discount })}
                    error={errors.discount}
                    keyboardType="decimal-pad"
                  />
                )}

                <Button
                  label={
                    isNew
                      ? t("productRecipe.addIngredient")
                      : t("common:actions.done")
                  }
                  onPress={handleSubmit}
                />
                {!isNew && draft && (
                  <ThemedView style={tw`items-center bg-transparent`}>
                    <Button
                      label={t("productRecipe.removeIngredient")}
                      leftIcon="trash"
                      variant="text"
                      size="small"
                      onPress={() => {
                        sheetRef.current?.dismiss();
                        onRemove(draft);
                      }}
                    />
                  </ThemedView>
                )}
              </>
            )}
          </BottomSheetScrollView>
        </ThemedBottomSheetModal>

        <BottomSheetPicker
          ref={itemPickerRef}
          title={t("productRecipe.fields.item")}
          searchable
          options={itemOptions}
          value={draft?.inventoryItemId}
          onChange={(value) => {
            const item = items.find((entry) => entry.id === String(value));
            if (item) pickItem(item);
          }}
          headerAction={{
            label: t("productRecipe.createItem"),
            onPress: () => {
              itemPickerRef.current?.dismiss();
              setNewItem({
                name: "",
                unit: InventoryUnit.UNIT,
                isUnlimited: false,
              });
              setErrors({});
              setCreating(true);
            },
          }}
        />

        <BottomSheetPicker
          ref={unitPickerRef}
          title={t("productRecipe.fields.unit")}
          options={UNITS.map((unit) => ({
            label: t(`units.${unit}`),
            value: unit,
          }))}
          value={newItem.unit}
          onChange={(value) =>
            setNewItem((current) => ({
              ...current,
              unit: value as InventoryUnit,
            }))
          }
        />
      </>
    );
  },
);

RecipeIngredientSheet.displayName = "RecipeIngredientSheet";

export default RecipeIngredientSheet;
