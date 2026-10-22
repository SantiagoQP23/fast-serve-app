import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import InfoTooltip from "@/presentation/theme/components/info-tooltip";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { toast } from "sonner-native";
import { queryClient } from "@/app/_layout";
import {
  inventoryItemsQueryKey,
  useInventoryItems,
} from "@/presentation/inventory/hooks/useInventoryItems";
import { InventoryUnit } from "@/core/inventory/models/inventory-item.model";
import { InventoryRecipeService } from "@/presentation/inventory/services/inventory-recipe.service";
import { refreshOptionRecipeInMenu } from "@/presentation/inventory/services/refresh-option-recipe-in-menu";
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

/**
 * Opens a picker of existing unit items first; "Create new inventory item"
 * moves on to the form that creates one named after the product.
 */
export default function WholeProductInventoryModal({
  visible,
  productOptionId,
  productName,
  productOptionName,
  replaceExisting,
  onClose,
}: WholeProductInventoryModalProps) {
  const { t } = useTranslation("inventory");
  const { items } = useInventoryItems();
  const itemPickerRef = useRef<BottomSheetPickerRef>(null);
  const formSheetRef = useRef<BottomSheetMethods>(null);
  const [isCreatingNewItem, setIsCreatingNewItem] = useState(false);
  // The picker dismisses itself before handing off to the form; this keeps
  // that dismissal from closing the whole flow.
  const isHandingOffToFormRef = useRef(false);

  useEffect(() => {
    if (visible) {
      itemPickerRef.current?.present();
    } else {
      itemPickerRef.current?.dismiss();
      formSheetRef.current?.dismiss();
    }
  }, [visible]);

  useEffect(() => {
    if (isCreatingNewItem) formSheetRef.current?.present();
  }, [isCreatingNewItem]);

  // Whole-product tracking is one unit per sale, so only unit items qualify.
  const uncategorizedLabel = t("categories.uncategorized");
  const itemOptions = items
    .filter((item) => item.isActive && item.unit === InventoryUnit.UNIT)
    .map((item) => ({
      label: item.name,
      value: item.id,
      group: item.category?.name ?? uncategorizedLabel,
    }))
    .sort(
      (a, b) =>
        a.group.localeCompare(b.group) || a.label.localeCompare(b.label),
    );

  const handleClose = () => {
    setIsCreatingNewItem(false);
    onClose();
  };

  const handlePickerDismiss = () => {
    if (isHandingOffToFormRef.current) {
      isHandingOffToFormRef.current = false;
      return;
    }
    handleClose();
  };

  const handleCreateNewItem = () => {
    isHandingOffToFormRef.current = true;
    setIsCreatingNewItem(true);
  };

  const handlePickExistingItem = (value: string | number) => {
    linkExistingItem({
      productOptionId,
      inventoryItemId: String(value),
      replaceExisting,
      errorMessage: t("recipe.saveError"),
      successMessage: t("recipe.saveSuccess"),
    });
  };

  return (
    <>
      <BottomSheetPicker
        ref={itemPickerRef}
        title={
          replaceExisting
            ? t("wholeProduct.switchTitle")
            : t("wholeProduct.configureTitle")
        }
        options={itemOptions}
        onChange={handlePickExistingItem}
        onDismiss={handlePickerDismiss}
        headerAction={{
          label: t("recipe.createNewItem"),
          onPress: handleCreateNewItem,
        }}
      />

      <ThemedBottomSheetModal
        ref={formSheetRef}
        enablePanDownToClose
        onDismiss={handleClose}
      >
        <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
          {visible && isCreatingNewItem && (
            <WholeProductInventoryForm
              productOptionId={productOptionId}
              productName={productName}
              productOptionName={productOptionName}
              replaceExisting={replaceExisting}
              onClose={handleClose}
            />
          )}
        </BottomSheetView>
      </ThemedBottomSheetModal>
    </>
  );
}

interface LinkExistingItemParams {
  productOptionId: number;
  inventoryItemId: string;
  replaceExisting?: boolean;
  errorMessage: string;
  successMessage: string;
}

// Runs after the picker has closed, so it takes everything it needs up front
// instead of reading props that reset once the flow ends.
async function linkExistingItem({
  productOptionId,
  inventoryItemId,
  replaceExisting,
  errorMessage,
  successMessage,
}: LinkExistingItemParams) {
  try {
    const previousLines = replaceExisting
      ? await InventoryRecipeService.getByProductOption(productOptionId)
      : [];
    const existingLine = previousLines.find(
      (line) =>
        (line.inventoryItem?.id ?? line.inventoryItemId) === inventoryItemId,
    );

    // Link first so the option is never left untracked; the ingredient
    // items themselves stay in the catalog.
    if (existingLine) {
      await InventoryRecipeService.update({ id: existingLine.id, quantity: 1 });
    } else {
      await InventoryRecipeService.create({
        productOptionId,
        inventoryItemId,
        quantity: 1,
      });
    }

    await Promise.all(
      previousLines
        .filter((line) => line.id !== existingLine?.id)
        .map((line) => InventoryRecipeService.remove(line.id)),
    );
    toast.success(successMessage);
  } catch (error) {
    toast.error(getErrorMessage(error, { fallback: errorMessage }));
  } finally {
    queryClient.invalidateQueries({
      queryKey: ["inventory-recipes", productOptionId],
    });
    queryClient.invalidateQueries({ queryKey: inventoryItemsQueryKey });
    queryClient.invalidateQueries({ queryKey: ["menu"] });
    refreshOptionRecipeInMenu(productOptionId);
  }
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
    refreshOptionRecipeInMenu(productOptionId);
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
