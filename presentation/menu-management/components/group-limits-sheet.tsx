import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Pressable } from "react-native";
import {
  BottomSheetScrollView,
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
import RadioButton from "@/presentation/theme/components/radio-button";
import Checkbox from "@/presentation/theme/components/checkbox";
import { parseAmount } from "@/presentation/menu-management/components/modifier-option-sheet";
import Icon from "@/presentation/theme/components/icon";
import IconButton from "@/presentation/theme/components/icon-button";
import { typography } from "@/constants/theme";
import {
  getLinkDefaultIds,
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
  /**
   * The product's own default options (plans/predeterminada-por-producto.md):
   * null follows the group's, [] means nothing picked.
   */
  defaultModifierIds: string[] | null;
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
  rule.minSelect === null &&
  rule.maxSelect === null &&
  rule.isOffered &&
  (rule.defaultModifierIds ?? null) === null;

/** Active options of the group, in order. */
const activeOptions = (group: ModifierGroup) =>
  [...(group.modifiers ?? [])]
    .filter((option) => option.isActive)
    .sort((a, b) => a.order - b.order);

/**
 * Own defaults kept to the options that still exist, in option order, and
 * no more than the maximum (decision 9: the first ones stay).
 */
export function fitDefaults(
  group: ModifierGroup,
  ids: string[] | null,
  max: number | null,
): string[] | null {
  if (ids === null) return null;
  const wanted = new Set(ids);
  const kept = [...(group.modifiers ?? [])]
    .sort((a, b) => a.order - b.order)
    .filter((option) => wanted.has(option.id))
    .map((option) => option.id);
  return max === null ? kept : kept.slice(0, max);
}

/** Names of the default options, or "Nada seleccionado". */
export function describeDefaults(
  t: (key: string, options?: Record<string, unknown>) => string,
  group: ModifierGroup,
  ids: string[],
): string {
  const wanted = new Set(ids);
  const names = activeOptions(group)
    .filter((option) => wanted.has(option.id))
    .map((option) => option.name);
  return names.length ? names.join(", ") : t("customization.defaults.nothing");
}

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
  const [productDefaults, setProductDefaults] = useState<string[] | null>(null);
  // The defaults being edited: null follows the level above.
  const [defaults, setDefaults] = useState<string[] | null>(null);
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
  // Errors show once Done was tried, then follow the fields as they change.
  const [showError, setShowError] = useState(false);

  /** Rule the view falls back to: the group's, or the product's for a variant. */
  const baseFor = (
    nextGroup: ModifierGroup,
    limits: Limits,
    variant: SheetVariant | null,
  ) => {
    if (!variant) return { min: nextGroup.minSelect, max: nextGroup.maxSelect };
    const { min, max } = getLinkLimits(limits, nextGroup);
    return { min, max };
  };

  const loadControls = (
    nextGroup: ModifierGroup,
    limits: Limits,
    variant: SheetVariant | null,
    rule: VariantGroupRule | undefined,
    ownDefaults: string[] | null,
  ) => {
    const base = baseFor(nextGroup, limits, variant);
    setDefaults(ownDefaults);
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
    setShowError(false);
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
      setProductDefaults(limits.defaultModifierIds);
      setEditing(null);
      loadControls(
        nextGroup,
        product,
        null,
        undefined,
        limits.defaultModifierIds,
      );
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  if (!group) return null;

  const base = baseFor(group, productLimits, editing);

  /** The controls as limits, or what's wrong with them. */
  const parseControls = ():
    | { limits: Limits; error: null }
    | { limits: null; error: string } => {
    if (!own)
      return { limits: { minSelect: null, maxSelect: null }, error: null };
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
    )
      return { limits: null, error: t("modifierGroups.errors.limits") };
    // An empty maximum falls back to the one above, so "no limit" only
    // exists when there is none above.
    if (max === null && base.max !== null)
      return {
        limits: null,
        error: t(
          editing
            ? "customization.limits.maxRequiredProduct"
            : "customization.limits.maxRequired",
          { count: base.max },
        ),
      };
    return {
      limits: { minSelect: required ? min : 0, maxSelect: max },
      error: null,
    };
  };

  const parsed = parseControls();

  // The maximum this view ends up with, to fit the defaults to it.
  const viewMax = own && parsed.limits ? parsed.limits.maxSelect : base.max;
  const options = activeOptions(group);
  const shownDefaults = fitDefaults(group, defaults, viewMax);
  /** What the level above pre-picks: the group's, or the product's. */
  const inheritedDefaults = getLinkDefaultIds(
    { defaultModifierIds: editing ? productDefaults : null, variants: [] },
    group,
  );

  const toggleDefault = (optionId: string) => {
    const current = shownDefaults ?? [];
    if (viewMax === 1) {
      setDefaults([optionId]);
      return;
    }
    if (current.includes(optionId)) {
      setDefaults(current.filter((id) => id !== optionId));
      return;
    }
    if (viewMax !== null && current.length >= viewMax) return;
    setDefaults([...current, optionId]);
  };

  /** The controls as limits, or null after showing what's wrong. */
  const readControls = (): Limits | null => {
    if (parsed.error) setShowError(true);
    return parsed.limits;
  };

  const ruleFor = (variantId: number) =>
    rules.find((rule) => rule.productOptionId === variantId);

  const openVariant = (variant: SheetVariant) => {
    const limits = readControls();
    if (!limits) return;
    setProductLimits(limits);
    setProductDefaults(shownDefaults);
    setEditing(variant);
    const rule = ruleFor(variant.id);
    loadControls(
      group,
      limits,
      variant,
      rule,
      rule?.defaultModifierIds ?? null,
    );
  };

  /** Back to the product's rule; a variant's edits keep only through Done. */
  const closeVariant = () => {
    setEditing(null);
    loadControls(group, productLimits, null, undefined, productDefaults);
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
        defaultModifierIds: offered ? shownDefaults : null,
      };
      setRules((current) => [
        ...current.filter((entry) => entry.productOptionId !== editing.id),
        ...(isNoOp(rule) ? [] : [rule]),
      ]);
      closeVariant();
      return;
    }
    const limits = readControls();
    if (!limits) return;
    onSubmit(group.id, {
      ...limits,
      variants: rules,
      defaultModifierIds: shownDefaults,
    });
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
    const own = rule?.defaultModifierIds;
    const withDefaults = Array.isArray(own)
      ? `${text} · ${t("customization.defaults.comes", {
          names: describeDefaults(t, group, own),
        })}`
      : text;
    return rule
      ? withDefaults
      : `${text} · ${t("customization.limits.sameAsProduct")}`;
  };

  const visible = !editing || offered;
  // What the waiter will face, as the owner would say it.
  const rule = !visible
    ? null
    : !own
      ? describeRule(t, base.min, base.max)
      : parsed.limits
        ? describeRule(t, parsed.limits.minSelect ?? 0, parsed.limits.maxSelect)
        : null;
  const error = showError ? parsed.error : null;

  return (
    <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
      <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-6`}>
        <ThemedView style={tw`flex-row items-center gap-1 bg-transparent`}>
          {editing && (
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={closeVariant}
              accessibilityLabel={t("common:actions.goBack")}
              style={tw`-ml-3`}
            />
          )}
          <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
            <ThemedText type="h3">
              {editing
                ? t("customization.limits.variantTitle", { name: editing.name })
                : t("customization.limits.title")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {group.name}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={tw`gap-3 bg-transparent`}>
          {editing && (
            <Switch
              label={t("customization.limits.offered")}
              value={offered}
              onValueChange={setOffered}
            />
          )}
          {visible && (
            <Switch
              label={t("customization.limits.own")}
              value={own}
              onValueChange={setOwn}
            />
          )}

          {visible && own && (
            <ThemedView style={tw`gap-3 pt-3 bg-transparent`}>
              <ThemedText style={{ fontFamily: typography.bold }}>
                {t("modifierGroups.fields.howMany")}
              </ThemedText>
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
                      {
                        label: t("modifierGroups.fields.exact"),
                        value: "exact",
                      },
                      {
                        label: t("modifierGroups.fields.range"),
                        value: "range",
                      },
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
                          : t("customization.limits.upToHint", {
                              count: base.max,
                            })
                      }
                      value={maxSelect}
                      onChangeText={setMaxSelect}
                      keyboardType="number-pad"
                    />
                  </ThemedView>
                </ThemedView>
              )}
            </ThemedView>
          )}

          {error ? (
            <ThemedView
              style={tw`flex-row items-start gap-2 bg-transparent`}
              accessibilityLiveRegion="polite"
            >
              <Icon
                name="circle-alert"
                size={16}
                color={tw.color("red-700")}
                style={tw`mt-0.5`}
              />
              <ThemedText type="body2" style={tw`flex-1 text-red-700`}>
                {error}
              </ThemedText>
            </ThemedView>
          ) : (
            rule && (
              <ThemedView
                style={tw`flex-row items-start gap-2 bg-transparent`}
                accessibilityLiveRegion="polite"
              >
                <Icon
                  name="hand-platter"
                  size={16}
                  color={tw.color("gray-500")}
                  style={tw`mt-0.5`}
                />
                <ThemedText type="body2" style={tw`flex-1 text-gray-600`}>
                  {rule}
                </ThemedText>
              </ThemedView>
            )
          )}
        </ThemedView>

        {visible && options.length > 0 && (
          <ThemedView style={tw`gap-1 bg-transparent`}>
            <ThemedText style={{ fontFamily: typography.bold }}>
              {t("customization.defaults.title")}
            </ThemedText>
            <ThemedText type="small" style={tw`text-gray-500`}>
              {t("customization.defaults.hint")}
            </ThemedText>
            <ThemedView style={tw`max-h-[40vh] bg-transparent`}>
              <BottomSheetScrollView showsVerticalScrollIndicator={false}>
                <RadioButton
                  selected={shownDefaults === null}
                  onPress={() => setDefaults(null)}
                  label={t(
                    editing
                      ? "customization.defaults.sameAsProduct"
                      : "customization.defaults.sameAsGroup",
                    { names: describeDefaults(t, group, inheritedDefaults) },
                  )}
                />
                <RadioButton
                  selected={
                    shownDefaults !== null && shownDefaults.length === 0
                  }
                  onPress={() => setDefaults([])}
                  label={t("customization.defaults.nothing")}
                />
                {options.map((option) =>
                  viewMax === 1 ? (
                    <RadioButton
                      key={option.id}
                      selected={!!shownDefaults?.includes(option.id)}
                      onPress={() => toggleDefault(option.id)}
                      label={option.name}
                    />
                  ) : (
                    <Checkbox
                      key={option.id}
                      value={!!shownDefaults?.includes(option.id)}
                      onValueChange={() => toggleDefault(option.id)}
                      label={option.name}
                      disabled={
                        !shownDefaults?.includes(option.id) &&
                        viewMax !== null &&
                        (shownDefaults?.length ?? 0) >= viewMax
                      }
                    />
                  ),
                )}
              </BottomSheetScrollView>
            </ThemedView>
          </ThemedView>
        )}

        {!editing && variants.length > 1 && (
          <ThemedView style={tw`gap-1 bg-transparent`}>
            <ThemedText style={{ fontFamily: typography.bold }}>
              {t("customization.limits.byVariant")}
            </ThemedText>
            <ThemedView style={tw`bg-transparent`}>
              {variants.map((variant, index) => {
                const summary = variantSummary(variant);
                const hasRule = !!ruleFor(variant.id);
                return (
                  <Pressable
                    key={variant.id}
                    onPress={() => openVariant(variant)}
                    accessibilityRole="button"
                    accessibilityLabel={`${variant.name}, ${summary}`}
                    style={({ pressed }) =>
                      tw.style(
                        "flex-row items-center gap-3 min-h-14 py-2",
                        index < variants.length - 1 &&
                          "border-b border-divider",
                        pressed && "opacity-70",
                      )
                    }
                  >
                    <ThemedView style={tw`flex-1 gap-0.5 bg-transparent`}>
                      <ThemedText
                        style={{ fontFamily: typography.medium }}
                        numberOfLines={1}
                      >
                        {variant.name}
                      </ThemedText>
                      <ThemedText
                        type="small"
                        style={tw.style(
                          hasRule ? "text-on-surface-variant" : "text-gray-500",
                        )}
                        numberOfLines={2}
                      >
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
          </ThemedView>
        )}

        <Button label={t("common:actions.done")} onPress={handleDone} />
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
});

GroupLimitsSheet.displayName = "GroupLimitsSheet";

export default GroupLimitsSheet;
