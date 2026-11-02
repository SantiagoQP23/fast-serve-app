import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
  BottomSheetView,
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
import InfoRow from "@/presentation/theme/components/info-row";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";
import { parseAmount } from "@/presentation/menu-management/components/modifier-option-sheet";
import type { InventoryItem } from "@/core/inventory/models/inventory-item.model";

/** One item a product includes, while the customization is being edited. */
export interface ProductComponentDraft {
  key: string;
  id?: string;
  name: string;
  removable: boolean;
  /** Shown positive ("1.50"); saved as a negative change. */
  discount: string;
  inventoryItemId: string | null;
  inventoryQuantity: string;
}

export type ProductComponentSheetRef = {
  /** Opens with an item to edit, or empty to add a new one. */
  present: (component?: ProductComponentDraft) => void;
  dismiss: () => void;
};

interface ProductComponentSheetProps {
  items: InventoryItem[];
  onSubmit: (component: ProductComponentDraft) => void;
  onRemove: (component: ProductComponentDraft) => void;
}

let draftKey = 0;
const emptyComponent = (): ProductComponentDraft => ({
  key: `new-${++draftKey}`,
  name: "",
  removable: true,
  discount: "",
  inventoryItemId: null,
  inventoryQuantity: "",
});

type FieldErrors = Partial<Record<"name" | "discount" | "quantity", string>>;

/**
 * Edits one item a product includes: its name, whether the waiter may take
 * it off (and for how much less), and the insumo it spends. Changes stay in
 * the customization screen until it saves.
 */
const ProductComponentSheet = forwardRef<
  ProductComponentSheetRef,
  ProductComponentSheetProps
>(({ items, onSubmit, onRemove }, ref) => {
  const { t } = useTranslation(["menuManagement", "common"]);
  const sheetRef = useRef<BottomSheetMethods>(null);
  const itemPickerRef = useRef<BottomSheetPickerRef>(null);
  const [draft, setDraft] = useState<ProductComponentDraft>(emptyComponent);
  const [isNew, setIsNew] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});

  useImperativeHandle(ref, () => ({
    present: (component) => {
      setDraft(component ?? emptyComponent());
      setIsNew(!component);
      setErrors({});
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const update = (change: Partial<ProductComponentDraft>) => {
    setDraft((current) => ({ ...current, ...change }));
    setErrors({});
  };

  const item = draft.inventoryItemId
    ? items.find((entry) => entry.id === draft.inventoryItemId)
    : undefined;

  const handleSubmit = () => {
    const discount =
      draft.discount.trim() === "" ? 0 : parseAmount(draft.discount);
    const next: FieldErrors = {};
    if (!draft.name.trim()) next.name = t("customization.errors.itemName");
    if (draft.removable && !(discount >= 0))
      next.discount = t("customization.errors.discount");
    if (draft.inventoryItemId && !(parseAmount(draft.inventoryQuantity) > 0))
      next.quantity = t("modifierGroups.errors.optionQuantity");
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    onSubmit({
      ...draft,
      name: draft.name.trim(),
      discount: draft.removable && discount > 0 ? String(discount) : "",
      inventoryQuantity: draft.inventoryItemId ? draft.inventoryQuantity : "",
    });
    sheetRef.current?.dismiss();
  };

  const handleRemove = () => {
    sheetRef.current?.dismiss();
    onRemove(draft);
  };

  return (
    <>
      <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
          <ThemedText type="h3">
            {isNew
              ? t("customization.newItem")
              : t("customization.editItem")}
          </ThemedText>

          <TextInput
            bottomSheet
            label={t("customization.fields.itemName")}
            placeholder={t("customization.fields.itemPlaceholder")}
            value={draft.name}
            onChangeText={(name) => update({ name })}
            error={errors.name}
            maxLength={60}
            autoFocus={isNew}
            returnKeyType="next"
          />

          <Switch
            label={t("customization.fields.removable")}
            value={draft.removable}
            onValueChange={(removable) => update({ removable })}
          />
          {draft.removable && (
            <TextInput
              bottomSheet
              label={t("customization.fields.discount")}
              placeholder="0"
              value={draft.discount}
              onChangeText={(discount) => update({ discount })}
              error={errors.discount}
              keyboardType="decimal-pad"
            />
          )}

          <InfoRow
            label={t("modifierGroups.fields.inventoryItem")}
            value={item ? `${item.name} (${item.unit})` : undefined}
            placeholder={t("modifierGroups.fields.noInventoryItem")}
            onPress={() => itemPickerRef.current?.present()}
          />
          {draft.inventoryItemId && (
            <TextInput
              bottomSheet
              label={t("modifierGroups.fields.inventoryQuantity")}
              value={draft.inventoryQuantity}
              onChangeText={(inventoryQuantity) =>
                update({ inventoryQuantity })
              }
              error={errors.quantity}
              keyboardType="decimal-pad"
            />
          )}

          <Button
            label={isNew ? t("customization.addItem") : t("common:actions.done")}
            onPress={handleSubmit}
          />
          {!isNew && (
            <ThemedView style={tw`items-center`}>
              <Button
                label={t("customization.removeItem")}
                leftIcon="trash"
                variant="text"
                size="small"
                onPress={handleRemove}
              />
            </ThemedView>
          )}
        </BottomSheetView>
      </ThemedBottomSheetModal>

      <BottomSheetPicker
        ref={itemPickerRef}
        title={t("modifierGroups.fields.inventoryItem")}
        searchable
        options={[
          { label: t("modifierGroups.fields.noInventoryItem"), value: "" },
          ...items
            .filter((entry) => entry.isActive)
            .map((entry) => ({
              label: entry.name,
              value: entry.id,
              description: entry.unit,
            })),
        ]}
        value={draft.inventoryItemId ?? ""}
        onChange={(value) =>
          update({ inventoryItemId: value ? String(value) : null })
        }
      />
    </>
  );
});

ProductComponentSheet.displayName = "ProductComponentSheet";

export default ProductComponentSheet;
