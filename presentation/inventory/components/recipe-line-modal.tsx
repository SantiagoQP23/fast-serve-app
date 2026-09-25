import { useState } from "react";
import { Modal, View } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import Select from "@/presentation/theme/components/select";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useInventoryRecipes } from "@/presentation/inventory/hooks/useInventoryRecipes";
import type { ProductOptionInventoryItem } from "@/core/inventory/models/inventory-recipe.model";

interface RecipeLineModalProps {
  visible: boolean;
  productOptionId: number;
  recipeLine: ProductOptionInventoryItem | null;
  onClose: () => void;
}

export default function RecipeLineModal({
  visible,
  productOptionId,
  recipeLine,
  onClose,
}: RecipeLineModalProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 bg-black/50 items-center justify-center px-6`}>
        {visible && (
          <RecipeLineForm
            key={recipeLine?.id ?? "new"}
            productOptionId={productOptionId}
            recipeLine={recipeLine}
            onClose={onClose}
          />
        )}
      </View>
    </Modal>
  );
}

interface RecipeLineFormProps {
  productOptionId: number;
  recipeLine: ProductOptionInventoryItem | null;
  onClose: () => void;
}

function RecipeLineForm({
  productOptionId,
  recipeLine,
  onClose,
}: RecipeLineFormProps) {
  const { t } = useTranslation("inventory");
  const isEditing = !!recipeLine;
  const { items } = useInventoryItems();
  const { createRecipe, updateRecipe } = useInventoryRecipes(productOptionId);
  const [inventoryItemId, setInventoryItemId] = useState(
    recipeLine?.inventoryItemId ?? "",
  );
  const [quantity, setQuantity] = useState(
    recipeLine ? String(recipeLine.quantity) : "",
  );

  const itemOptions = items
    .filter((item) => item.isActive)
    .map((item) => ({ label: item.name, value: item.id }));

  const isPending = createRecipe.isPending || updateRecipe.isPending;

  const handleSubmit = async () => {
    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0.001) return;

    if (isEditing) {
      await updateRecipe.mutateAsync({
        id: recipeLine.id,
        quantity: parsedQuantity,
      });
    } else {
      if (!inventoryItemId) return;
      await createRecipe.mutateAsync({
        productOptionId,
        inventoryItemId,
        quantity: parsedQuantity,
      });
    }
    onClose();
  };

  return (
    <View style={tw`bg-white rounded-2xl w-full p-6 shadow-lg gap-4`}>
      <ThemedText type="h3" style={{ fontFamily: typography.medium }}>
        {isEditing ? t("recipe.editLine") : t("recipe.addLine")}
      </ThemedText>

      {!isEditing && (
        <Select
          label={t("recipe.fields.item")}
          options={itemOptions}
          value={inventoryItemId}
          onChange={(v) => setInventoryItemId(String(v))}
          placeholder={t("recipe.placeholders.item")}
        />
      )}

      <TextInput
        label={t("recipe.fields.quantity")}
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="decimal-pad"
        placeholder={t("recipe.placeholders.quantity")}
      />

      <View style={tw`flex-row justify-end gap-2`}>
        <Button
          label={t("cancel")}
          onPress={onClose}
          variant="text"
          size="small"
          disabled={isPending}
        />
        <Button
          label={t("confirm")}
          onPress={handleSubmit}
          size="small"
          loading={isPending}
          disabled={
            !quantity ||
            Number(quantity) < 0.001 ||
            (!isEditing && !inventoryItemId)
          }
        />
      </View>
    </View>
  );
}
