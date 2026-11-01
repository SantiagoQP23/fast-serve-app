import { Pressable } from "react-native";

import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import {
  getActiveGroups,
  getProductComponents,
  isModifierOutOfStock,
  toggleComponent,
  toggleModifier,
  type ActiveGroup,
  type CustomizationSelection,
  type ModifierOption,
} from "@/core/menu/models/customization.model";
import type { Product } from "@/core/menu/models/product.model";
import Chip from "@/presentation/theme/components/chip";
import Icon from "@/presentation/theme/components/icon";
import Label from "@/presentation/theme/components/label";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";

export const signedCurrency = (value: number) =>
  `${value < 0 ? "−" : "+"}${formatCurrency(Math.abs(value))}`;

function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <ThemedView style={tw`flex-row items-baseline gap-2 flex-wrap bg-transparent`}>
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
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={single ? "radio" : "checkbox"}
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={[
        option.name,
        delta ? signedCurrency(delta) : null,
        soldOut ? soldOutLabel : null,
      ]
        .filter(Boolean)
        .join(", ")}
      style={({ pressed }) => [
        tw`flex-row items-center gap-3 min-h-12`,
        pressed && tw`opacity-60`,
        disabled && tw`opacity-50`,
      ]}
    >
      <Icon
        name={
          single
            ? selected
              ? "circle-dot"
              : "circle"
            : selected
              ? "square-check"
              : "square"
        }
        size={22}
      />
      <ThemedText style={tw`flex-1`}>{option.name}</ThemedText>
      {soldOut && <Label size="small" color="default" text={soldOutLabel} />}
      {delta !== 0 && (
        <ThemedText type="body2" style={tw`text-gray-600`}>
          {signedCurrency(delta)}
        </ThemedText>
      )}
    </Pressable>
  );
}

/**
 * The product's "Incluye" items (tap to take one off) and its groups of
 * options (radio for "elige 1", checkboxes otherwise). Used by the product
 * sheet and the edit-line screen.
 */
export default function CustomizationPicker({
  product,
  selection,
  onChange,
  blocksWithoutStock,
}: {
  product: Product;
  selection: CustomizationSelection;
  onChange: (
    update: (current: CustomizationSelection) => CustomizationSelection,
  ) => void;
  /** Sold-out options can't be picked when the restaurant blocks overselling. */
  blocksWithoutStock: boolean;
}) {
  const { t } = useTranslation("menu");
  const groups = getActiveGroups(product);
  const components = getProductComponents(product);

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
      {components.length > 0 && (
        <ThemedView style={tw`gap-3 bg-transparent`}>
          <Header
            title={t("menu:customization.includes")}
            subtitle={
              components.some((component) => component.removable)
                ? t("menu:customization.tapToRemove")
                : undefined
            }
          />
          <ThemedView style={tw`flex-row flex-wrap gap-2 bg-transparent`}>
            {components.map((component) => {
              const removed = selection.removedComponentIds.includes(
                component.id,
              );
              const delta = Number(component.removalPriceDelta);
              const label = removed
                ? `${t("menu:customization.without")} ${component.name}${
                    delta ? ` (${signedCurrency(delta)})` : ""
                  }`
                : component.name;
              return (
                <Chip
                  key={component.id}
                  label={label}
                  selected={!removed}
                  disabled={!component.removable}
                  onPress={() =>
                    onChange((current) => toggleComponent(current, component.id))
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
            <Header title={group.group.name} subtitle={groupSubtitle(group)} />
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
