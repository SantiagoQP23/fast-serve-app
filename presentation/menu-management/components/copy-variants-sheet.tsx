import { useMemo, type RefObject } from "react";
import { Pressable } from "react-native";
import {
  BottomSheetFlatList,
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import Icon from "@/presentation/theme/components/icon";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import type { Product } from "@/core/menu/models/product.model";

const MAX_PRODUCT_NAMES = 3;

export interface VariantSetOption {
  name: string;
  price: number;
  isDefault: boolean;
}

interface VariantSet {
  key: string;
  options: VariantSetOption[];
  productNames: string[];
}

/**
 * Groups the restaurant's products with two or more variants by their
 * variants (names and prices), most used first.
 */
export const getVariantSets = (products: Product[]): VariantSet[] => {
  const sets = new Map<string, VariantSet>();
  products.forEach((product) => {
    if (!product.options || product.options.length < 2) return;
    const options = product.options.map((option) => ({
      name: option.name.trim(),
      price: Number(option.price) || 0,
      isDefault: !!option.isDefault,
    }));
    const key = options
      .map((option) => `${option.name.toLowerCase()}:${option.price}`)
      .join("|");
    const set = sets.get(key);
    if (set) {
      set.productNames.push(product.name);
    } else {
      sets.set(key, { key, options, productNames: [product.name] });
    }
  });
  return [...sets.values()].sort(
    (a, b) =>
      b.productNames.length - a.productNames.length ||
      a.options[0].name.localeCompare(b.options[0].name),
  );
};

interface CopyVariantsSheetProps {
  sheetRef: RefObject<BottomSheetMethods | null>;
  products: Product[];
  onSelect: (options: VariantSetOption[]) => void;
}

/** Lists the variant sets already used in the menu to copy one. */
export default function CopyVariantsSheet({
  sheetRef,
  products,
  onSelect,
}: CopyVariantsSheetProps) {
  const { t } = useTranslation("menuManagement");
  const variantSets = useMemo(() => getVariantSets(products), [products]);

  const describeProducts = (names: string[]) => {
    const shown = names.slice(0, MAX_PRODUCT_NAMES).join(", ");
    return names.length > MAX_PRODUCT_NAMES
      ? t("products.variants.copy.andMore", {
          names: shown,
          count: names.length - MAX_PRODUCT_NAMES,
        })
      : shown;
  };

  return (
    <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
      <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
        <ThemedText type="h3">{t("products.variants.copy.title")}</ThemedText>
        {variantSets.length === 0 ? (
          <ThemedView
            style={tw`items-center py-6 gap-2 bg-surface-high rounded-3xl px-4`}
          >
            <Icon
              name="sliders-horizontal"
              size={28}
              color={tw.color("gray-400")}
            />
            <ThemedText type="body2" style={tw`text-center text-gray-500`}>
              {t("products.variants.copy.empty")}
            </ThemedText>
          </ThemedView>
        ) : (
          <BottomSheetFlatList
            data={variantSets}
            keyExtractor={(item: VariantSet) => item.key}
            contentContainerStyle={tw`gap-2`}
            renderItem={({ item }: { item: VariantSet }) => (
              <Pressable
                onPress={() => {
                  onSelect(item.options);
                  sheetRef.current?.dismiss();
                }}
                style={({ pressed }) =>
                  tw.style(
                    "gap-1 p-3 rounded-xl bg-surface-container-low",
                    pressed && "opacity-60",
                  )
                }
              >
                <ThemedText
                  type="body1"
                  style={{ fontFamily: typography.semibold }}
                >
                  {item.options
                    .map(
                      (option) =>
                        `${option.name} ${formatCurrency(option.price)}`,
                    )
                    .join(" · ")}
                </ThemedText>
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {describeProducts(item.productNames)}
                </ThemedText>
              </Pressable>
            )}
          />
        )}
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
}
