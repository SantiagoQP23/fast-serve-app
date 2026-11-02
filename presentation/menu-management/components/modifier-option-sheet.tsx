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
import type { InventoryItem } from "@/core/inventory/models/inventory-item.model";

/** One option of a group while it's being edited, before the group saves. */
export interface ModifierOptionDraft {
  key: string;
  id?: string;
  name: string;
  priceDelta: string;
  isActive: boolean;
  inventoryItemId: string | null;
  inventoryQuantity: string;
}

export type ModifierOptionSheetRef = {
  /** Opens with an option to edit, or empty to add a new one. */
  present: (option?: ModifierOptionDraft) => void;
  dismiss: () => void;
};

interface ModifierOptionSheetProps {
  items: InventoryItem[];
  onSubmit: (option: ModifierOptionDraft) => void;
  onRemove: (option: ModifierOptionDraft) => void;
}

let draftKey = 0;
const emptyOption = (): ModifierOptionDraft => ({
  key: `new-${++draftKey}`,
  name: "",
  priceDelta: "",
  isActive: true,
  inventoryItemId: null,
  inventoryQuantity: "",
});

export const parseAmount = (value: string) => {
  const parsed = parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : NaN;
};

type FieldErrors = Partial<Record<"name" | "price" | "quantity", string>>;

/**
 * Edits one option of a group: name, extra price, the insumo it spends and
 * whether waiters see it. Changes stay in the group form until it saves.
 */
const ModifierOptionSheet = forwardRef<
  ModifierOptionSheetRef,
  ModifierOptionSheetProps
>(({ items, onSubmit, onRemove }, ref) => {
  const { t } = useTranslation(["menuManagement", "common"]);
  const sheetRef = useRef<BottomSheetMethods>(null);
  const itemPickerRef = useRef<BottomSheetPickerRef>(null);
  const [draft, setDraft] = useState<ModifierOptionDraft>(emptyOption);
  const [isNew, setIsNew] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});

  useImperativeHandle(ref, () => ({
    present: (option) => {
      // A free option opens with an empty price, so typing doesn't give "05".
      setDraft(
        option
          ? {
              ...option,
              priceDelta: parseAmount(option.priceDelta)
                ? option.priceDelta
                : "",
            }
          : emptyOption(),
      );
      setIsNew(!option);
      setErrors({});
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const update = (change: Partial<ModifierOptionDraft>) => {
    setDraft((current) => ({ ...current, ...change }));
    setErrors({});
  };

  const item = draft.inventoryItemId
    ? items.find((entry) => entry.id === draft.inventoryItemId)
    : undefined;

  const handleSubmit = () => {
    const price =
      draft.priceDelta.trim() === "" ? 0 : parseAmount(draft.priceDelta);
    const next: FieldErrors = {};
    if (!draft.name.trim()) next.name = t("modifierGroups.errors.optionName");
    if (!(price >= 0)) next.price = t("modifierGroups.errors.optionPrice");
    if (draft.inventoryItemId && !(parseAmount(draft.inventoryQuantity) > 0))
      next.quantity = t("modifierGroups.errors.optionQuantity");
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    onSubmit({
      ...draft,
      name: draft.name.trim(),
      priceDelta: String(price),
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
              ? t("modifierGroups.newOption")
              : t("modifierGroups.editOption")}
          </ThemedText>

          <TextInput
            bottomSheet
            label={t("modifierGroups.fields.optionName")}
            value={draft.name}
            onChangeText={(name) => update({ name })}
            error={errors.name}
            maxLength={60}
            autoFocus={isNew}
            returnKeyType="next"
          />
          <TextInput
            bottomSheet
            label={t("modifierGroups.fields.priceDelta")}
            placeholder="0"
            value={draft.priceDelta}
            onChangeText={(priceDelta) => update({ priceDelta })}
            error={errors.price}
            keyboardType="decimal-pad"
          />

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

          {!isNew && (
            <Switch
              label={t("modifierGroups.fields.optionActive")}
              value={draft.isActive}
              onValueChange={(isActive) => update({ isActive })}
            />
          )}

          <Button
            label={
              isNew ? t("modifierGroups.addOption") : t("common:actions.done")
            }
            onPress={handleSubmit}
          />
          {!isNew && (
            <ThemedView style={tw`items-center`}>
              <Button
                label={t("modifierGroups.removeOption")}
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

ModifierOptionSheet.displayName = "ModifierOptionSheet";

export default ModifierOptionSheet;
