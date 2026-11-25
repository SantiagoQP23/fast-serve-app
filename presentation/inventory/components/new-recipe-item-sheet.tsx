import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
  BottomSheetScrollView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import TextInput from "@/presentation/theme/components/text-input";
import Button from "@/presentation/theme/components/button";
import Switch from "@/presentation/theme/components/switch";
import Chip from "@/presentation/theme/components/chip";
import {
  InventoryUnit,
  type InventoryItem,
} from "@/core/inventory/models/inventory-item.model";

export type NewRecipeItemSheetRef = {
  /** Opens with the name the user was searching for. */
  present: (name: string) => void;
};

interface NewRecipeItemSheetProps {
  /** Creates the insumo; resolves with it. */
  onCreate: (input: {
    name: string;
    unit: InventoryUnit;
    isUnlimited: boolean;
  }) => Promise<InventoryItem>;
  onCreated: (item: InventoryItem) => void;
}

const UNITS = Object.values(InventoryUnit);

/** Creates an insumo from the recipe's insumo picker. */
const NewRecipeItemSheet = forwardRef<
  NewRecipeItemSheetRef,
  NewRecipeItemSheetProps
>(({ onCreate, onCreated }, ref) => {
  const { t } = useTranslation(["inventory", "common"]);
  const sheetRef = useRef<BottomSheetMethods>(null);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState(InventoryUnit.UNIT);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useImperativeHandle(ref, () => ({
    present: (initialName) => {
      setName(initialName);
      setUnit(InventoryUnit.UNIT);
      setIsUnlimited(false);
      setError(undefined);
      sheetRef.current?.present();
    },
  }));

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError(t("productRecipe.errors.itemName"));
      return;
    }
    try {
      setSaving(true);
      const item = await onCreate({ name: trimmed, unit, isUnlimited });
      sheetRef.current?.dismiss();
      onCreated(item);
    } catch {
      // The mutation shows the error; the sheet stays to retry.
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
      <BottomSheetScrollView
        contentContainerStyle={tw`px-4 pb-6 pt-2 gap-6`}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText type="h3" style={{ fontFamily: typography.medium }}>
          {t("productRecipe.newItem")}
        </ThemedText>

        <TextInput
          bottomSheet
          label={t("productRecipe.fields.itemName")}
          value={name}
          onChangeText={(value) => {
            setName(value);
            setError(undefined);
          }}
          error={error}
          maxLength={100}
          autoFocus
          returnKeyType="done"
        />

        {/* Five units: one tap here beats a picker stacked on this sheet */}
        <ThemedView style={tw`gap-2 bg-transparent`}>
          <ThemedText
            type="body2"
            style={[tw`text-gray-500`, { fontFamily: typography.medium }]}
          >
            {t("productRecipe.fields.unit")}
          </ThemedText>
          <ThemedView
            style={tw`flex-row flex-wrap gap-2 bg-transparent`}
            accessibilityRole="radiogroup"
          >
            {UNITS.map((value) => (
              <Chip
                key={value}
                label={t(`units.${value}`, { count: 2 })}
                selected={unit === value}
                onPress={() => setUnit(value)}
              />
            ))}
          </ThemedView>
        </ThemedView>

        <ThemedView style={tw`gap-1 bg-transparent`}>
          <Switch
            label={t("unlimited.label")}
            value={isUnlimited}
            onValueChange={setIsUnlimited}
          />
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("unlimited.hint")}
          </ThemedText>
        </ThemedView>

        <ThemedView style={tw`flex-row gap-2 bg-transparent`}>
          <Button
            label={t("common:actions.cancel")}
            variant="text"
            disabled={saving}
            onPress={() => sheetRef.current?.dismiss()}
            style={tw`flex-1`}
          />
          <Button
            label={t("productRecipe.createItem")}
            onPress={handleCreate}
            loading={saving}
            disabled={saving}
            style={tw`flex-1`}
          />
        </ThemedView>
      </BottomSheetScrollView>
    </ThemedBottomSheetModal>
  );
});

NewRecipeItemSheet.displayName = "NewRecipeItemSheet";

export default NewRecipeItemSheet;
