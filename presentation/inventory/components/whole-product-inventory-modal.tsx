import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import InfoTooltip from "@/presentation/theme/components/info-tooltip";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { toast } from "sonner-native";
import { queryClient } from "@/app/_layout";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { InventoryUnit } from "@/core/inventory/models/inventory-item.model";
import { InventoryRecipeService } from "@/presentation/inventory/services/inventory-recipe.service";
import { getErrorMessage } from "@/core/api/get-error-message";

interface WholeProductInventoryModalProps {
  visible: boolean;
  productOptionId: number;
  productName?: string;
  productOptionName?: string;
  /** Switching from ingredients: the option's current recipe lines are unlinked once the item is created. */
  replaceExisting?: boolean;
  onClose: () => void;
}

export default function WholeProductInventoryModal({
  visible,
  productOptionId,
  productName,
  productOptionName,
  replaceExisting,
  onClose,
}: WholeProductInventoryModalProps) {
  const bottomSheetRef = useRef<BottomSheetMethods>(null);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  return (
    <ThemedBottomSheetModal
      ref={bottomSheetRef}
      enablePanDownToClose
      onDismiss={onClose}
    >
      <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
        {visible && (
          <WholeProductInventoryForm
            productOptionId={productOptionId}
            productName={productName}
            productOptionName={productOptionName}
            replaceExisting={replaceExisting}
            onClose={onClose}
          />
        )}
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
}

interface WholeProductInventoryFormProps {
  productOptionId: number;
  productName?: string;
  productOptionName?: string;
  replaceExisting?: boolean;
  onClose: () => void;
}

function WholeProductInventoryForm({
  productOptionId,
  productName,
  productOptionName,
  replaceExisting,
  onClose,
}: WholeProductInventoryFormProps) {
  const { t } = useTranslation("inventory");
  const { createItem } = useInventoryItems();

  const [quantity, setQuantity] = useState("");
  const [minimumQuantity, setMinimumQuantity] = useState("");

  const isPending = createItem.isPending;

  const handleSubmit = async () => {
    const parsedQuantity = Number(quantity.replace(",", "."));
    const parsedMinimumQuantity = Number(minimumQuantity.replace(",", "."));
    const safeQuantity = Number.isFinite(parsedQuantity) ? parsedQuantity : 0;
    const safeMinimumQuantity = Number.isFinite(parsedMinimumQuantity)
      ? parsedMinimumQuantity
      : 0;

    const trimmedName = [productName, productOptionName]
      .filter(Boolean)
      .join(" ")
      .trim();

    // Read before creating: the new item adds its own line to the option.
    const previousLines = replaceExisting
      ? await InventoryRecipeService.getByProductOption(productOptionId)
      : [];

    // The backend links the option and files the item under an inventory
    // category named after the product's category, creating it if needed.
    await createItem.mutateAsync({
      name: trimmedName,
      unit: InventoryUnit.UNIT,
      quantity: safeQuantity,
      minimumQuantity: safeMinimumQuantity,
      recipeLines: [{ productOptionId, quantity: 1 }],
      useProductCategory: true,
    });

    queryClient.invalidateQueries({
      queryKey: ["inventory-recipes", productOptionId],
    });
    queryClient.invalidateQueries({ queryKey: ["inventory-categories"] });

    // Unlink only after the whole-product item exists so the option is never
    // left untracked. The ingredient items themselves stay in the catalog.
    try {
      await Promise.all(
        previousLines.map((line) => InventoryRecipeService.remove(line.id)),
      );
    } catch (error) {
      toast.error(getErrorMessage(error, { fallback: t("recipe.deleteError") }));
    } finally {
      queryClient.invalidateQueries({
        queryKey: ["inventory-recipes", productOptionId],
      });
    }

    queryClient.invalidateQueries({ queryKey: ["menu"] });
    onClose();
  };

  return (
    <>
      <ThemedText type="h3">
        {replaceExisting
          ? t("wholeProduct.switchTitle")
          : t("wholeProduct.configureTitle")}
      </ThemedText>
      {replaceExisting && (
        <ThemedText type="small" style={tw`text-gray-500`}>
          {t("wholeProduct.replaceNote")}
        </ThemedText>
      )}

      <View style={tw`flex-row gap-2`}>
        <View style={tw`flex-1`}>
          <TextInput
            bottomSheet
            variant="outlined"
            label={t("wholeProduct.fields.currentQuantity")}
            placeholder={t("placeholders.quantity")}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={tw`flex-1`}>
          <TextInput
            bottomSheet
            variant="outlined"
            label={t("fields.minimumQuantity")}
            placeholder={t("placeholders.minimumQuantity")}
            value={minimumQuantity}
            onChangeText={setMinimumQuantity}
            keyboardType="decimal-pad"
            trailingIcon={
              <InfoTooltip text={t("wholeProduct.fields.minimumQuantityInfo")} />
            }
          />
        </View>
      </View>

      <View style={tw`flex-row justify-end gap-2`}>
        <Button
          label={t("confirm")}
          onPress={handleSubmit}
          loading={isPending}
          disabled={isPending}
        />
      </View>
    </>
  );
}
