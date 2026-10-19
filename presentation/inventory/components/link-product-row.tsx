import { Pressable } from "react-native";
import Icon from "@/presentation/theme/components/icon";
import Checkbox from "@/presentation/theme/components/checkbox";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import type { Product } from "@/core/menu/models/product.model";
import type { ProductOption } from "@/core/menu/models/product-optionl.model";

interface LinkProductRowProps {
  product: Product;
  /** Active variants of the product, in menu order. */
  options: ProductOption[];
  selectedIds: Set<number>;
  linkedIds: Set<number>;
  expanded: boolean;
  onToggleExpanded: () => void;
  onToggleOptions: (optionIds: number[], selected: boolean) => void;
}

/**
 * One menu product in the "link to products" picker. A product with one
 * variant is checked directly; one with several expands to its variants.
 * Variants already linked to the item stay checked and can't be changed.
 */
export default function LinkProductRow({
  product,
  options,
  selectedIds,
  linkedIds,
  expanded,
  onToggleExpanded,
  onToggleOptions,
}: LinkProductRowProps) {
  const { t } = useTranslation("inventory");

  const isChecked = (option: ProductOption) =>
    linkedIds.has(option.id) || selectedIds.has(option.id);
  const freeOptions = options.filter((option) => !linkedIds.has(option.id));
  const checkedCount = options.filter(isChecked).length;
  const allChecked = options.length > 0 && checkedCount === options.length;

  if (options.length === 0) return null;

  if (options.length === 1) {
    const option = options[0];
    const linked = linkedIds.has(option.id);

    return (
      <Pressable
        disabled={linked}
        onPress={() =>
          onToggleOptions([option.id], !selectedIds.has(option.id))
        }
        style={({ pressed }) => [
          tw`p-4 rounded-2xl bg-surface-container-low flex-row items-center gap-3`,
          pressed && tw`opacity-80`,
        ]}
      >
        <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
          <ThemedText type="body1" numberOfLines={1}>
            {product.name}
          </ThemedText>
          <ThemedText type="body2" style={tw`text-gray-600`}>
            {linked
              ? t("linkedItem.alreadyLinked")
              : formatCurrency(option.price)}
          </ThemedText>
        </ThemedView>
        <Checkbox
          value={isChecked(option)}
          disabled={linked}
          onValueChange={(value) => onToggleOptions([option.id], value)}
        />
      </Pressable>
    );
  }

  return (
    <ThemedView
      style={tw`rounded-2xl bg-surface-container-low overflow-hidden`}
    >
      <Pressable
        onPress={onToggleExpanded}
        accessibilityState={{ expanded }}
        style={({ pressed }) => [
          tw`p-4 flex-row items-center gap-3`,
          pressed && tw`opacity-80`,
        ]}
      >
        <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
          <ThemedText type="body1" numberOfLines={1}>
            {product.name}
          </ThemedText>
          <ThemedText type="body2" style={tw`text-gray-600`} numberOfLines={1}>
            {checkedCount > 0
              ? t("linkedItem.checkedOfTotal", {
                  checked: checkedCount,
                  total: options.length,
                })
              : options.map((option) => option.name).join(" - ")}
          </ThemedText>
        </ThemedView>
        <Icon
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={tw.color("gray-500")}
        />
      </Pressable>

      {expanded && (
        <ThemedView style={tw`bg-transparent px-4 pb-2`}>
          <Pressable
            disabled={freeOptions.length === 0}
            onPress={() =>
              onToggleOptions(
                freeOptions.map((option) => option.id),
                !allChecked,
              )
            }
            style={({ pressed }) => [
              tw`flex-row items-center gap-3 py-3 border-t border-border`,
              pressed && tw`opacity-80`,
            ]}
          >
            <ThemedText
              type="body2"
              style={[tw`flex-1`, { fontFamily: typography.medium }]}
            >
              {t("linkedItem.allVariants")}
            </ThemedText>
            <Checkbox
              value={allChecked}
              disabled={freeOptions.length === 0}
              onValueChange={(value) =>
                onToggleOptions(
                  freeOptions.map((option) => option.id),
                  value,
                )
              }
            />
          </Pressable>

          {options.map((option) => {
            const linked = linkedIds.has(option.id);
            return (
              <Pressable
                key={option.id}
                disabled={linked}
                onPress={() =>
                  onToggleOptions([option.id], !selectedIds.has(option.id))
                }
                style={({ pressed }) => [
                  tw`flex-row items-center gap-3 py-3 border-t border-border`,
                  pressed && tw`opacity-80`,
                ]}
              >
                <ThemedView style={tw`flex-1 gap-0.5 bg-transparent`}>
                  <ThemedText type="body2" numberOfLines={1}>
                    {option.name}
                  </ThemedText>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {linked
                      ? t("linkedItem.alreadyLinked")
                      : formatCurrency(option.price)}
                  </ThemedText>
                </ThemedView>
                <Checkbox
                  value={isChecked(option)}
                  disabled={linked}
                  onValueChange={(value) => onToggleOptions([option.id], value)}
                />
              </Pressable>
            );
          })}
        </ThemedView>
      )}
    </ThemedView>
  );
}
