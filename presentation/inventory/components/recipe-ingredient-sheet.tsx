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
import Checkbox from "@/presentation/theme/components/checkbox";
import Counter from "@/presentation/theme/components/counter";
import { parseAmount } from "@/presentation/menu-management/components/modifier-option-sheet";
import { InventoryUnit } from "@/core/inventory/models/inventory-item.model";
import type { RecipeIngredientDraft } from "@/presentation/inventory/store/recipeDraftStore";

export type { RecipeIngredientDraft } from "@/presentation/inventory/store/recipeDraftStore";

export interface RecipeVariant {
  id: number;
  name: string;
}

export type RecipeIngredientSheetRef = {
  /** One ingredient to edit, or several to go through one after another. */
  present: (ingredients: RecipeIngredientDraft[]) => void;
  dismiss: () => void;
};

interface RecipeIngredientSheetProps {
  variants: RecipeVariant[];
  /** Only owners and admins change what can be removed (it changes prices). */
  canSetRemovals: boolean;
  onSubmit: (ingredient: RecipeIngredientDraft) => void;
  onRemove: (ingredient: RecipeIngredientDraft) => void;
}

type FieldErrors = Partial<Record<"quantities" | "discount", string>>;

/** A serving's worth: whole units, a few grams, or a fraction of a kilo. */
const STEP: Record<InventoryUnit, number> = {
  [InventoryUnit.UNIT]: 1,
  [InventoryUnit.G]: 10,
  [InventoryUnit.ML]: 10,
  [InventoryUnit.KG]: 0.05,
  [InventoryUnit.L]: 0.05,
};

/** The draft keeps amounts as typed: "" is "no amount yet". */
const toNumber = (raw: string | undefined) =>
  raw && raw.trim() !== "" ? parseAmount(raw) || 0 : 0;
const toRaw = (value: number) => (value > 0 ? String(value) : "");

/** Starts split when the variants already use different amounts. */
const variesByVariant = (
  line: RecipeIngredientDraft,
  variants: RecipeVariant[],
) => {
  if (variants.length < 2) return false;
  const values = variants.map((variant) => line.quantities[variant.id]);
  return values.some((value) => value === undefined) || new Set(values).size > 1;
};

/** One segment per insumo in the queue, inked up to the current one. */
function QueueProgress({ total, current }: { total: number; current: number }) {
  return (
    <ThemedView
      style={tw`flex-row gap-1 bg-transparent`}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: total }, (_, position) => (
        <ThemedView
          key={position}
          style={tw.style(
            "flex-1 h-1 rounded-full",
            position <= current ? "bg-primary" : "bg-surface-high",
          )}
        />
      ))}
    </ThemedView>
  );
}

/**
 * The amount of one insumo in a product's recipe, per variant, and whether the
 * customer can ask for the dish without it (plans/unificar-receta-incluidos.md).
 * Insumos just picked come in a queue: Siguiente moves to the next one.
 * Changes stay on the recipe screen until it saves.
 */
const RecipeIngredientSheet = forwardRef<
  RecipeIngredientSheetRef,
  RecipeIngredientSheetProps
>(({ variants, canSetRemovals, onSubmit, onRemove }, ref) => {
  const { t } = useTranslation(["inventory", "common"]);
  const sheetRef = useRef<BottomSheetMethods>(null);
  const [queue, setQueue] = useState<RecipeIngredientDraft[]>([]);
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<RecipeIngredientDraft | null>(null);
  const [perVariant, setPerVariant] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const multiVariant = variants.length > 1;

  const open = (line: RecipeIngredientDraft) => {
    setDraft(line);
    setPerVariant(variesByVariant(line, variants));
    setErrors({});
  };

  useImperativeHandle(ref, () => ({
    present: (ingredients) => {
      if (!ingredients.length) return;
      setQueue(ingredients);
      setIndex(0);
      open(ingredients[0]);
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

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

  /** One amount, written to every variant. */
  const setSharedQuantity = (value: string) =>
    update({
      quantities: Object.fromEntries(
        variants.map((variant) => [variant.id, value]),
      ),
    });

  const firstAmount = (line: RecipeIngredientDraft) =>
    variants
      .map((variant) => line.quantities[variant.id])
      .find((value) => value !== undefined && value !== "") ?? "";

  const togglePerVariant = (next: boolean) => {
    setPerVariant(next);
    // Back to one amount: every variant takes the first one written.
    if (!next && draft) setSharedQuantity(firstAmount(draft));
  };

  const goTo = (next: number) => {
    setIndex(next);
    open(queue[next]);
  };

  const unlimited = !!draft?.inventoryItem.isUnlimited;
  const isLast = index >= queue.length - 1;

  const handleSubmit = () => {
    if (!draft) return;
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
    onSubmit({
      ...draft,
      discount: draft.removable && discount > 0 ? String(discount) : "",
    });
    if (isLast) sheetRef.current?.dismiss();
    else goTo(index + 1);
  };

  const handleRemove = () => {
    if (!draft) return;
    onRemove(draft);
    if (isLast) sheetRef.current?.dismiss();
    else goTo(index + 1);
  };

  const item = draft?.inventoryItem;
  const unitFor = (count: number) =>
    item ? t(`units.${item.unit}`, { count }) : "";
  const step = item ? STEP[item.unit] : 1;
  const shared = draft ? toNumber(firstAmount(draft)) : 0;

  // What one serving means for the stock on hand: the consequence of the
  // amount, not a restatement of it.
  const coverage =
    item && !unlimited && !perVariant && shared > 0
      ? t("productRecipe.coversFor", {
          stock: t("quantityWithUnit", {
            quantity: Number(Math.max(item.quantity, 0).toFixed(3)),
            unit: unitFor(item.quantity),
          }),
          count: Math.floor(Math.max(item.quantity, 0) / shared),
        })
      : null;

  return (
    <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
      <BottomSheetScrollView
        contentContainerStyle={tw`px-4 pb-6 pt-2`}
        keyboardShouldPersistTaps="handled"
      >
        {draft && item && (
          // Keyed by insumo so every step starts fresh.
          <ThemedView
            key={draft.inventoryItemId}
            style={tw`gap-6 bg-transparent`}
          >
            <ThemedView style={tw`gap-3 bg-transparent`}>
              {queue.length > 1 && (
                <QueueProgress total={queue.length} current={index} />
              )}
              <ThemedView style={tw`gap-1 bg-transparent`}>
                <ThemedView
                  style={tw`flex-row items-baseline gap-3 bg-transparent`}
                >
                  <ThemedText
                    type="h3"
                    numberOfLines={2}
                    style={[tw`flex-1`, { fontFamily: typography.medium }]}
                  >
                    {item.name}
                  </ThemedText>
                  {queue.length > 1 && (
                    <ThemedText
                      type="body2"
                      style={[
                        tw`text-gray-500`,
                        { fontFamily: typography.medium },
                      ]}
                    >
                      {t("productRecipe.step", {
                        current: index + 1,
                        total: queue.length,
                      })}
                    </ThemedText>
                  )}
                </ThemedView>
                <ThemedText type="body2" style={tw`text-gray-500`}>
                  {[
                    unlimited
                      ? t("unlimited.label")
                      : t("productRecipe.amountPerServing"),
                    // The row counters are too narrow to carry the unit.
                    perVariant && unitFor(2),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={tw`gap-3 bg-transparent`}>
              {/* Above the amounts, so it stays put when the rows appear */}
              {multiVariant && (
                <Switch
                  label={t("productRecipe.perVariant")}
                  value={perVariant}
                  onValueChange={togglePerVariant}
                />
              )}
              {perVariant ? (
                variants.map((variant) => {
                  const raw = draft.quantities[variant.id];
                  const used = raw !== undefined;
                  const value = toNumber(raw);
                  return (
                    <ThemedView
                      key={variant.id}
                      style={tw`flex-row items-center gap-3 min-h-12 bg-transparent`}
                    >
                      <ThemedView style={tw`flex-1 bg-transparent`}>
                        <Checkbox
                          label={variant.name}
                          labelType="body1"
                          value={used}
                          onValueChange={(checked) =>
                            setQuantity(variant.id, checked ? "" : null)
                          }
                        />
                      </ThemedView>
                      {used ? (
                        <Counter
                          size="medium"
                          value={value}
                          onChangeValue={(next) =>
                            setQuantity(variant.id, toRaw(next))
                          }
                          step={step}
                          min={0}
                          accessibilityLabel={`${variant.name}, ${unitFor(value)}`}
                          style={tw`w-52`}
                        />
                      ) : (
                        <ThemedText
                          type="body2"
                          style={tw`w-52 text-center text-gray-500`}
                        >
                          {t("productRecipe.notUsed")}
                        </ThemedText>
                      )}
                    </ThemedView>
                  );
                })
              ) : (
                <Counter
                  value={shared}
                  onChangeValue={(next) => setSharedQuantity(toRaw(next))}
                  step={step}
                  min={0}
                  unit={unitFor(shared)}
                  accessibilityLabel={t("productRecipe.amountPerServing")}
                />
              )}

              {(errors.quantities || coverage || unlimited) && (
                <ThemedText
                  type="body2"
                  style={tw.style(
                    "text-center",
                    errors.quantities ? "text-red-500" : "text-gray-500",
                  )}
                >
                  {errors.quantities ??
                    (unlimited
                      ? t("productRecipe.unlimitedQuantityHint")
                      : coverage)}
                </ThemedText>
              )}

            </ThemedView>

            <ThemedView
              style={tw`gap-3 pt-5 border-t border-divider bg-transparent`}
            >
              <ThemedView style={tw`gap-1 bg-transparent`}>
                <Switch
                  label={t("productRecipe.fields.removable")}
                  value={draft.removable}
                  disabled={!canSetRemovals}
                  onValueChange={(removable) => update({ removable })}
                />
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {canSetRemovals
                    ? t("productRecipe.removableHint", { name: item.name })
                    : t("productRecipe.removableAdminOnly")}
                </ThemedText>
              </ThemedView>
              {draft.removable && (
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
            </ThemedView>

            <ThemedView style={tw`flex-row gap-2 bg-transparent`}>
              <Button
                label={t("productRecipe.removeShort")}
                accessibilityLabel={t("productRecipe.removeIngredient")}
                leftIcon="trash"
                variant="text"
                onPress={handleRemove}
                style={tw`flex-1`}
              />
              <Button
                label={
                  isLast ? t("common:actions.done") : t("productRecipe.next")
                }
                rightIcon={isLast ? undefined : "arrow-right"}
                onPress={handleSubmit}
                style={tw`flex-1`}
              />
            </ThemedView>
          </ThemedView>
        )}
      </BottomSheetScrollView>
    </ThemedBottomSheetModal>
  );
});

RecipeIngredientSheet.displayName = "RecipeIngredientSheet";

export default RecipeIngredientSheet;
