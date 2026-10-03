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
import { queryClient } from "@/app/_layout";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useInventoryRecipes } from "@/presentation/inventory/hooks/useInventoryRecipes";
import { InventoryUnit } from "@/core/inventory/models/inventory-item.model";
import type { ProductOptionInventoryItem } from "@/core/inventory/models/inventory-recipe.model";

interface WholeProductInventoryModalProps {
  visible: boolean;
  productOptionId: number;
  productName?: string;
  productOptionName?: string;
  line: ProductOptionInventoryItem | null;
  onClose: () => void;
}

export default function WholeProductInventoryModal({
  visible,
  productOptionId,
  productName,
  productOptionName,
  line,
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
            key={line?.id ?? "new"}
            productOptionId={productOptionId}
            productName={productName}
            productOptionName={productOptionName}
            line={line}
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
  line: ProductOptionInventoryItem | null;
  onClose: () => void;
}

function WholeProductInventoryForm({
  productOptionId,
  productName,
  productOptionName,
  line,
  onClose,
}: WholeProductInventoryFormProps) {
  const { t } = useTranslation("inventory");
  const isEditing = !!line;
  const { createItem, updateItem } = useInventoryItems();
  const { createRecipe } = useInventoryRecipes(productOptionId);

  const [quantity, setQuantity] = useState(
    line?.inventoryItem?.quantity != null ? String(line.inventoryItem.quantity) : "",
  );
  const [minimumQuantity, setMinimumQuantity] = useState(
    line?.inventoryItem?.minimumQuantity != null
      ? String(line.inventoryItem.minimumQuantity)
      : "",
  );

  const isPending =
    createItem.isPending || createRecipe.isPending || updateItem.isPending;

  const handleSubmit = async () => {
    const parsedQuantity = Number(quantity.replace(",", "."));
    const parsedMinimumQuantity = Number(minimumQuantity.replace(",", "."));
    const safeQuantity = Number.isFinite(parsedQuantity) ? parsedQuantity : 0;
    const safeMinimumQuantity = Number.isFinite(parsedMinimumQuantity)
      ? parsedMinimumQuantity
      : 0;

    if (isEditing && line.inventoryItem) {
      await updateItem.mutateAsync({
        id: line.inventoryItem.id,
        quantity: safeQuantity,
        minimumQuantity: safeMinimumQuantity,
      });
    } else {
      const trimmedName = [productName, productOptionName]
        .filter(Boolean)
        .join(" ")
        .trim();

      const newItem = await createItem.mutateAsync({
        name: trimmedName,
        unit: InventoryUnit.UNIT,
        quantity: safeQuantity,
        minimumQuantity: safeMinimumQuantity,
        categoryId: null,
      });

      await createRecipe.mutateAsync({
        productOptionId,
        inventoryItemId: newItem.id,
        quantity: 1,
      });
    }

    queryClient.invalidateQueries({ queryKey: ["menu"] });
    onClose();
  };

  return (
    <>
      <ThemedText type="h3">
        {isEditing ? t("wholeProduct.editTitle") : t("wholeProduct.configureTitle")}
      </ThemedText>

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
