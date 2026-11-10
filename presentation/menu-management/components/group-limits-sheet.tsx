import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Pressable } from "react-native";
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
import Icon from "@/presentation/theme/components/icon";
import {
  getLinkLimits,
  type ModifierGroup,
  type VariantGroupRule,
} from "@/core/menu/models/customization.model";

/** A product's own limits for a linked group; null keeps the group's. */
export interface GroupLimits {
  minSelect: number | null;
  maxSelect: number | null;
  /** Variants with their own rule (plans/limites-por-variante.md). */
  variants: VariantGroupRule[];
}

/** An active variant of the product, as the sheet lists it. */
export interface SheetVariant {
  id: number;
  name: string;
}

export type GroupLimitsSheetRef = {
  present: (
    group: ModifierGroup,
    limits: GroupLimits,
    variants: SheetVariant[],
  ) => void;
  dismiss: () => void;
};

type Limits = { minSelect: number | null; maxSelect: number | null };

/** A rule that changes nothing isn't kept. */
const isNoOp = (rule: VariantGroupRule) =>
  rule.minSelect === null && rule.maxSelect === null && rule.isOffered;

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

/** The rule as the owner would say it: "El mesero debe elegir exactamente 3." */
export function describeRule(
  t: (key: string, options?: Record<string, unknown>) => string,
  min: number,
  max: number | null,
): string {
  if (max === 1)
    return min > 0
      ? t("modifierGroups.rule.pickOneRequired")
      : t("modifierGroups.rule.pickOneOptional");
  if (min > 0 && max !== null)
    return min === max
      ? t("modifierGroups.rule.exactly", { count: min })
      : t("modifierGroups.rule.range", { min, max });
  if (min > 0) return t("modifierGroups.rule.atLeast", { count: min });
  if (max !== null) return t("modifierGroups.rule.upTo", { count: max });
  return t("modifierGroups.rule.any");
}

/**
 * How many options of a shared group this product asks for, and, for a
 * product with variants, each variant's own rule (or that it isn't offered
 * there). The group keeps its own rule for every other product; e.g.
 * "Salsas" can be required with 2 picks here and optional elsewhere.
 */
const GroupLimitsSheet = forwardRef<
  GroupLimitsSheetRef,
  { onSubmit: (groupId: string, limits: GroupLimits) => void }
>(({ onSubmit }, ref) => {
  const { t } = useTranslation(["menuManagement", "common"]);
  const sheetRef = useRef<BottomSheetMethods>(null);
  const [group, setGroup] = useState<ModifierGroup | null>(null);
  const [variants, setVariants] = useState<SheetVariant[]>([]);
  const [productLimits, setProductLimits] = useState<Limits>({
    minSelect: null,
    maxSelect: null,
  });
  const [rules, setRules] = useState<VariantGroupRule[]>([]);
  // Null: the product's rule; otherwise the variant being edited.
  const [editing, setEditing] = useState<SheetVariant | null>(null);

  // The controls, shared by the product and variant views.
  const [own, setOwn] = useState(false);
  const [offered, setOffered] = useState(true);
  const [single, setSingle] = useState(true);
  const [required, setRequired] = useState(false);
  const [exact, setExact] = useState(false);
  const [minSelect, setMinSelect] = useState("1");
  const [maxSelect, setMaxSelect] = useState("");
  const [error, setError] = useState<string | null>(null);

  /** Rule the view falls back to: the group's, or the product's for a variant. */
  const baseFor = (
    nextGroup: ModifierGroup,
    limits: Limits,
    variant: SheetVariant | null,
  ) => {
    if (!variant)
      return { min: nextGroup.minSelect, max: nextGroup.maxSelect };
    const { min, max } = getLinkLimits(limits, nextGroup);
    return { min, max };
  };

  const loadControls = (
    nextGroup: ModifierGroup,
    limits: Limits,
    variant: SheetVariant | null,
    rule?: VariantGroupRule,
  ) => {
    const base = baseFor(nextGroup, limits, variant);
    const ownMin = variant ? (rule?.minSelect ?? null) : limits.minSelect;
    const ownMax = variant ? (rule?.maxSelect ?? null) : limits.maxSelect;
    const min = ownMin ?? base.min;
    const max = ownMax ?? base.max;
    setOwn(ownMin !== null || ownMax !== null);
    setOffered(rule?.isOffered ?? true);
    setSingle(max === 1);
    setRequired(min > 0);
    setExact(min > 0 && max !== null && max !== 1 && min === max);
    setMinSelect(String(Math.max(min, 1)));
    setMaxSelect(max !== null && max !== 1 ? String(max) : "");
    setError(null);
  };

  useImperativeHandle(ref, () => ({
    present: (nextGroup, limits, nextVariants) => {
      const product = {
        minSelect: limits.minSelect,
        maxSelect: limits.maxSelect,
      };
      setGroup(nextGroup);
      setVariants(nextVariants);
      setProductLimits(product);
      setRules(limits.variants);
      setEditing(null);
      loadControls(nextGroup, product, null);
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  if (!group) return null;

  const base = baseFor(group, productLimits, editing);

  /** The controls as limits, or null after showing what's wrong. */
  const readControls = (): Limits | null => {
    if (!own) return { minSelect: null, maxSelect: null };
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
      return null;
    }
    // An empty maximum falls back to the one above, so "no limit" only
    // exists when there is none above.
    if (max === null && base.max !== null) {
      setError(
        t(
          editing
            ? "customization.limits.maxRequiredProduct"
            : "customization.limits.maxRequired",
          { count: base.max },
        ),
      );
      return null;
    }
    return { minSelect: required ? min : 0, maxSelect: max };
  };

  const ruleFor = (variantId: number) =>
    rules.find((rule) => rule.productOptionId === variantId);

  const openVariant = (variant: SheetVariant) => {
    const limits = readControls();
    if (!limits) return;
    setProductLimits(limits);
    setEditing(variant);
    loadControls(group, limits, variant, ruleFor(variant.id));
  };

  const handleDone = () => {
    if (editing) {
      const limits = offered
        ? readControls()
        : { minSelect: null, maxSelect: null };
      if (!limits) return;
      const rule: VariantGroupRule = {
        productOptionId: editing.id,
        ...limits,
        isOffered: offered,
      };
      setRules((current) => [
        ...current.filter((entry) => entry.productOptionId !== editing.id),
        ...(isNoOp(rule) ? [] : [rule]),
      ]);
      setEditing(null);
      loadControls(group, productLimits, null);
      return;
    }
    const limits = readControls();
    if (!limits) return;
    onSubmit(group.id, { ...limits, variants: rules });
    sheetRef.current?.dismiss();
  };

  /** What a variant asks for, as its row shows it. */
  const variantSummary = (variant: SheetVariant) => {
    const rule = ruleFor(variant.id);
    if (rule && !rule.isOffered) return t("customization.limits.notOffered");
    const { min, max } = getLinkLimits(
      { ...productLimits, variants: rule ? [rule] : [] },
      group,
      variant.id,
    );
    const text = describeLimits(t, min, max);
    return rule ? text : `${text} · ${t("customization.limits.sameAsProduct")}`;
  };

  return (
    <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
      <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
        <ThemedView style={tw`gap-1 bg-transparent`}>
          <ThemedText type="h3">
            {editing
              ? t("customization.limits.variantTitle", { name: editing.name })
              : t("customization.limits.title")}
          </ThemedText>
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {group.name}
          </ThemedText>
        </ThemedView>

        {editing && (
          <Switch
            label={t("customization.limits.offered")}
            value={offered}
            onValueChange={(value) => {
              setOffered(value);
              setError(null);
            }}
          />
        )}

        {(!editing || offered) && (
          <Switch
            label={t("customization.limits.own")}
            value={own}
            onValueChange={(value) => {
              setOwn(value);
              setError(null);
            }}
          />
        )}
        {(!editing || offered) && !own && (
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {t(
              editing
                ? "customization.limits.usesProduct"
                : "customization.limits.usesGroup",
              { rule: describeLimits(t, base.min, base.max) },
            )}
          </ThemedText>
        )}

        {(!editing || offered) && own && (
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
                      base.max === null
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

        {!editing && variants.length > 1 && (
          <ThemedView style={tw`gap-1 bg-transparent`}>
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("customization.limits.byVariant")}
            </ThemedText>
            {variants.map((variant) => {
              const summary = variantSummary(variant);
              return (
                <Pressable
                  key={variant.id}
                  onPress={() => openVariant(variant)}
                  accessibilityRole="button"
                  accessibilityLabel={`${variant.name}, ${summary}`}
                  style={({ pressed }) =>
                    tw.style(
                      "flex-row items-center gap-3 min-h-12 py-2",
                      pressed && "opacity-60",
                    )
                  }
                >
                  <ThemedView style={tw`flex-1 bg-transparent`}>
                    <ThemedText>{variant.name}</ThemedText>
                    <ThemedText type="small" style={tw`text-gray-500`}>
                      {summary}
                    </ThemedText>
                  </ThemedView>
                  <Icon
                    name="chevron-right"
                    size={18}
                    color={tw.color("gray-400")}
                  />
                </Pressable>
              );
            })}
          </ThemedView>
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
