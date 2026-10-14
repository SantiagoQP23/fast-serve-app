import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";
import Label from "@/presentation/theme/components/label";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { getWholeProductLine } from "@/core/inventory/models/inventory-recipe.model";
import {
  getProductOptionAvailableQuantity,
  getProductOptionStockLevel,
  type ProductOption,
} from "@/core/menu/models/product-optionl.model";

interface OptionInventorySectionProps {
  option: ProductOption;
  onOpen: () => void;
  onSwitchMode: () => void;
}

// Stock summary for a variant that already tracks inventory: units left, a
// shortcut to where that stock lives, and a switch between tracking modes.
export default function OptionInventorySection({
  option,
  onOpen,
  onSwitchMode,
}: OptionInventorySectionProps) {
  const { t } = useTranslation("inventory");

  const isWholeProduct = !!getWholeProductLine(option.inventoryItems);
  const available = getProductOptionAvailableQuantity(option) ?? 0;
  const stockLevel = getProductOptionStockLevel(option, available);

  return (
    <ThemedView style={tw`gap-3`}>
      <ThemedText type="caption">{t("optionInventory.title")}</ThemedText>

      <ThemedView style={tw`flex-row items-center justify-between gap-3`}>
        <ThemedView style={tw`flex-1 gap-0.5`}>
          <ThemedView style={tw`flex-row items-center gap-2 flex-wrap`}>
            <ThemedText type="h4">
              {t("optionInventory.left", { count: available })}
            </ThemedText>
            {stockLevel === "out" && (
              <Label
                text={t("optionInventory.outOfStock")}
                color="error"
                size="small"
              />
            )}
            {stockLevel === "low" && (
              <Label text={t("status.low")} color="warning" size="small" />
            )}
          </ThemedView>
          {/* <ThemedText type="small" style={tw`text-gray-500`}> */}
          {/*   {isWholeProduct */}
          {/*     ? t("trackMode.wholeProduct.label") */}
          {/*     : t("trackMode.ingredients.label")} */}
          {/* </ThemedText> */}
        </ThemedView>

        <IconButton
          icon="chevron-forward-outline"
          size={20}
          onPress={onOpen}
          accessibilityLabel={
            isWholeProduct
              ? t("optionInventory.openItem")
              : t("optionInventory.openIngredients")
          }
        />
      </ThemedView>

      <Button
        label={
          isWholeProduct
            ? t("optionInventory.switchToIngredients")
            : t("optionInventory.switchToWholeProduct")
        }
        leftIcon="swap-horizontal-outline"
        variant="outline"
        size="small"
        onPress={onSwitchMode}
      />
    </ThemedView>
  );
}
