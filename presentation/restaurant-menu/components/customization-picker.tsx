import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import {
  getActiveGroups,
  getRemovableIngredients,
  groupLabel,
  isModifierOutOfStock,
  toggleIngredient,
  toggleModifier,
  type ActiveGroup,
  type CustomizationSelection,
  type ModifierOption,
} from "@/core/menu/models/customization.model";
import type { Product } from "@/core/menu/models/product.model";
import Checkbox from "@/presentation/theme/components/checkbox";
import Chip from "@/presentation/theme/components/chip";
import Label from "@/presentation/theme/components/label";
import RadioButton from "@/presentation/theme/components/radio-button";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";

export const signedCurrency = (value: number) =>
  `${value < 0 ? "−" : "+"}${formatCurrency(Math.abs(value))}`;

function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <ThemedView
      style={tw`flex-row items-baseline gap-2 flex-wrap bg-transparent`}
    >
      <ThemedText
        accessibilityRole="header"
        style={{ fontFamily: typography.bold }}
      >
        {title}
      </ThemedText>
      {subtitle ? (
        <ThemedText type="small" style={tw`text-gray-500`}>
          {subtitle}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

/** One option of a group: radio when the group takes one, checkbox otherwise. */
function ModifierOptionRow({
  option,
  single,
  selected,
  soldOut,
  disabled,
  soldOutLabel,
  onPress,
}: {
  option: ModifierOption;
  single: boolean;
  selected: boolean;
  soldOut: boolean;
  disabled: boolean;
  soldOutLabel: string;
  onPress: () => void;
}) {
  const delta = Number(option.priceDelta);
  const accessibilityLabel = [
    option.name,
    delta ? signedCurrency(delta) : null,
    soldOut ? soldOutLabel : null,
  ]
    .filter(Boolean)
    .join(", ");
  const trailing = (soldOut || delta !== 0) && (
    <>
      {soldOut && <Label size="small" color="default" text={soldOutLabel} />}
      {delta !== 0 && (
        <ThemedText type="body2" style={tw`text-gray-600`}>
          {signedCurrency(delta)}
        </ThemedText>
      )}
    </>
  );

  if (single) {
    return (
      <RadioButton
        selected={selected}
        onPress={onPress}
        disabled={disabled}
        label={option.name}
        trailing={trailing}
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  return (
    <Checkbox
      value={selected}
      onValueChange={onPress}
      disabled={disabled}
      label={option.name}
      labelType="body1"
      trailing={trailing}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

/**
 * The variant's removable recipe ingredients (tap to take one off,
 * plans/unificar-receta-incluidos.md) and the product's groups of
 * options (radio for "elige 1", checkboxes otherwise). Used by the product
 * sheet and the edit-line screen.
 */
export default function CustomizationPicker({
  product,
  variantId,
  selection,
  onChange,
  blocksWithoutStock,
}: {
  product: Product;
  /** The line's variant: its own group rules apply. */
  variantId?: number | null;
  selection: CustomizationSelection;
  onChange: (
    update: (current: CustomizationSelection) => CustomizationSelection,
  ) => void;
  /** Sold-out options can't be picked when the restaurant blocks overselling. */
  blocksWithoutStock: boolean;
}) {
  const { t } = useTranslation("menu");
  const groups = getActiveGroups(product, variantId);
  const ingredients = getRemovableIngredients(product, variantId);

  const groupSubtitle = (group: ActiveGroup) => {
    if (group.min > 0)
      return group.max !== null && group.max !== group.min
        ? t("menu:customization.requiredRange", {
            min: group.min,
            max: group.max,
          })
        : t("menu:customization.required", { count: group.min });
    return group.max !== null
      ? t("menu:customization.optionalUpTo", { count: group.max })
      : t("menu:customization.optional");
  };

  return (
    <>
      {ingredients.length > 0 && (
        <ThemedView style={tw`gap-3 bg-transparent`}>
          <Header
            title={t("menu:customization.includes")}
            subtitle={t("menu:customization.tapToRemove")}
          />
          <ThemedView style={tw`flex-row flex-wrap gap-2 bg-transparent`}>
            {ingredients.map((ingredient) => {
              const removed = (
                selection.removedInventoryItemIds ?? []
              ).includes(ingredient.inventoryItemId);
              const delta = ingredient.removalPriceDelta;
              const label = removed
                ? `${t("menu:customization.without")} ${ingredient.name}${
                    delta ? ` (${signedCurrency(delta)})` : ""
                  }`
                : ingredient.name;
              return (
                <Chip
                  key={ingredient.inventoryItemId}
                  label={label}
                  selected={!removed}
                  onPress={() =>
                    onChange((current) =>
                      toggleIngredient(current, ingredient.inventoryItemId),
                    )
                  }
                />
              );
            })}
          </ThemedView>
        </ThemedView>
      )}

      {groups.map((group) => {
        const single = group.max === 1;
        const pickedInGroup = group.options.filter((option) =>
          selection.modifierIds.includes(option.id),
        ).length;
        const groupFull = group.max !== null && pickedInGroup >= group.max;
        return (
          <ThemedView key={group.linkId} style={tw`gap-1 bg-transparent`}>
            <Header
              title={groupLabel(group.group)}
              subtitle={groupSubtitle(group)}
            />
            <ThemedView
              accessibilityRole={single ? "radiogroup" : undefined}
              style={tw`bg-transparent`}
            >
              {group.options.map((option) => {
                const selected = selection.modifierIds.includes(option.id);
                const soldOut = isModifierOutOfStock(option);
                return (
                  <ModifierOptionRow
                    key={option.id}
                    option={option}
                    single={single}
                    selected={selected}
                    soldOut={soldOut}
                    soldOutLabel={t("menu:customization.soldOut")}
                    disabled={
                      !selected &&
                      ((soldOut && blocksWithoutStock) ||
                        (!single && groupFull))
                    }
                    onPress={() =>
                      onChange((current) =>
                        toggleModifier(current, group, option.id),
                      )
                    }
                  />
                );
              })}
            </ThemedView>
          </ThemedView>
        );
      })}
    </>
  );
}
