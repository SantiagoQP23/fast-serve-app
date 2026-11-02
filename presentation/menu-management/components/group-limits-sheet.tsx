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
import ButtonGroup from "@/presentation/theme/components/button-group";
import Switch from "@/presentation/theme/components/switch";
import { parseAmount } from "@/presentation/menu-management/components/modifier-option-sheet";
import type { ModifierGroup } from "@/core/menu/models/customization.model";

/** A product's own limits for a linked group; null keeps the group's. */
export interface GroupLimits {
  minSelect: number | null;
  maxSelect: number | null;
}

export type GroupLimitsSheetRef = {
  present: (group: ModifierGroup, limits: GroupLimits) => void;
  dismiss: () => void;
};

/** Short rule for a min/max pair: "Elige 1 · Obligatorio", "Varios · 2–3". */
export function describeLimits(
  t: (key: string, options?: Record<string, unknown>) => string,
  min: number,
  max: number | null,
): string {
  if (max === 1)
    return [
      t("modifierGroups.pickOne"),
      min > 0 ? t("modifierGroups.required") : t("modifierGroups.optional"),
    ].join(" · ");
  const amount =
    min > 0 && max !== null
      ? min === max
        ? t("customization.limits.exactly", { count: min })
        : t("customization.limits.range", { min, max })
      : min > 0
        ? t("customization.limits.atLeast", { count: min })
        : max !== null
          ? t("customization.limits.upTo", { count: max })
          : null;
  return [
    t("modifierGroups.pickMany"),
    min > 0 ? t("modifierGroups.required") : t("modifierGroups.optional"),
    amount,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * How many options of a shared group this product asks for. The group keeps
 * its own rule for every other product; e.g. "Salsas" can be required with
 * 2 picks here and optional elsewhere.
 */
const GroupLimitsSheet = forwardRef<
  GroupLimitsSheetRef,
  { onSubmit: (groupId: string, limits: GroupLimits) => void }
>(({ onSubmit }, ref) => {
  const { t } = useTranslation(["menuManagement", "common"]);
  const sheetRef = useRef<BottomSheetMethods>(null);
  const [group, setGroup] = useState<ModifierGroup | null>(null);
  const [own, setOwn] = useState(false);
  const [single, setSingle] = useState(true);
  const [required, setRequired] = useState(false);
  const [exact, setExact] = useState(false);
  const [minSelect, setMinSelect] = useState("1");
  const [maxSelect, setMaxSelect] = useState("");
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    present: (nextGroup, limits) => {
      const min = limits.minSelect ?? nextGroup.minSelect;
      const max = limits.maxSelect ?? nextGroup.maxSelect;
      setGroup(nextGroup);
      setOwn(limits.minSelect !== null || limits.maxSelect !== null);
      setSingle(max === 1);
      setRequired(min > 0);
      setExact(min > 0 && max !== null && max !== 1 && min === max);
      setMinSelect(String(Math.max(min, 1)));
      setMaxSelect(max !== null && max !== 1 ? String(max) : "");
      setError(null);
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  if (!group) return null;

  const handleDone = () => {
    if (!own) {
      onSubmit(group.id, { minSelect: null, maxSelect: null });
      sheetRef.current?.dismiss();
      return;
    }
    const min = single ? 1 : Math.round(parseAmount(minSelect));
    const max = single
      ? 1
      : required && exact
        ? min
        : maxSelect.trim() === ""
          ? null
          : Math.round(parseAmount(maxSelect));
    if (
      !single &&
      ((required && !(min >= 1)) ||
        (max !== null && !(max >= 1)) ||
        (required && max !== null && min > max))
    ) {
      setError(t("modifierGroups.errors.limits"));
      return;
    }
    // A product's empty maximum falls back to the group's, so "no limit"
    // only exists when the group has none.
    if (max === null && group.maxSelect !== null) {
      setError(
        t("customization.limits.maxRequired", { count: group.maxSelect }),
      );
      return;
    }
    onSubmit(group.id, { minSelect: required ? min : 0, maxSelect: max });
    sheetRef.current?.dismiss();
  };

  return (
    <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
      <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
        <ThemedView style={tw`gap-1 bg-transparent`}>
          <ThemedText type="h3">{t("customization.limits.title")}</ThemedText>
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {group.name}
          </ThemedText>
        </ThemedView>

        <Switch
          label={t("customization.limits.own")}
          value={own}
          onValueChange={(value) => {
            setOwn(value);
            setError(null);
          }}
        />
        {!own && (
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {t("customization.limits.usesGroup", {
              rule: describeLimits(t, group.minSelect, group.maxSelect),
            })}
          </ThemedText>
        )}

        {own && (
          <>
            <ThemedView style={tw`flex-row bg-transparent`}>
              <ButtonGroup
                size="small"
                selected={single ? "one" : "many"}
                onChange={(value: string) => setSingle(value === "one")}
                options={[
                  {
                    label: t("modifierGroups.pickOne"),
                    value: "one",
                    icon: "circle-dot",
                  },
                  {
                    label: t("modifierGroups.pickMany"),
                    value: "many",
                    icon: "square-check",
                  },
                ]}
              />
            </ThemedView>
            <Switch
              label={t("modifierGroups.fields.required")}
              value={required}
              onValueChange={setRequired}
            />
            {!single && required && (
              <ThemedView style={tw`flex-row bg-transparent`}>
                <ButtonGroup
                  size="small"
                  selected={exact ? "exact" : "range"}
                  onChange={(value: string) => setExact(value === "exact")}
                  options={[
                    { label: t("modifierGroups.fields.exact"), value: "exact" },
                    { label: t("modifierGroups.fields.range"), value: "range" },
                  ]}
                />
              </ThemedView>
            )}
            {!single && required && exact && (
              <TextInput
                bottomSheet
                label={t("modifierGroups.fields.quantity")}
                value={minSelect}
                onChangeText={setMinSelect}
                keyboardType="number-pad"
              />
            )}
            {!single && !(required && exact) && (
              <ThemedView style={tw`flex-row gap-3 bg-transparent`}>
                {required && (
                  <ThemedView style={tw`flex-1 bg-transparent`}>
                    <TextInput
                      bottomSheet
                      label={t("modifierGroups.fields.min")}
                      value={minSelect}
                      onChangeText={setMinSelect}
                      keyboardType="number-pad"
                    />
                  </ThemedView>
                )}
                <ThemedView style={tw`flex-1 bg-transparent`}>
                  <TextInput
                    bottomSheet
                    label={t("modifierGroups.fields.max")}
                    placeholder={
                      group.maxSelect === null
                        ? t("modifierGroups.fields.noLimit")
                        : undefined
                    }
                    value={maxSelect}
                    onChangeText={setMaxSelect}
                    keyboardType="number-pad"
                  />
                </ThemedView>
              </ThemedView>
            )}
          </>
        )}

        {error && (
          <ThemedText type="small" style={tw`text-red-700`}>
            {error}
          </ThemedText>
        )}

        <Button label={t("common:actions.done")} onPress={handleDone} />
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
});

GroupLimitsSheet.displayName = "GroupLimitsSheet";

export default GroupLimitsSheet;
