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
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useInventoryItemCategories } from "@/presentation/inventory/hooks/useInventoryItemCategories";
import type { InventoryItemCategory } from "@/core/inventory/models/inventory-item-category.model";

interface CreateCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (category: InventoryItemCategory) => void;
}

export default function CreateCategoryModal({
  visible,
  onClose,
  onCreated,
}: CreateCategoryModalProps) {
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
          <CreateCategoryForm onClose={onClose} onCreated={onCreated} />
        )}
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
}

interface CreateCategoryFormProps {
  onClose: () => void;
  onCreated: (category: InventoryItemCategory) => void;
}

function CreateCategoryForm({ onClose, onCreated }: CreateCategoryFormProps) {
  const { t } = useTranslation("inventory");
  const { createCategory } = useInventoryItemCategories();
  const [name, setName] = useState("");

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const newCategory = await createCategory.mutateAsync({
      name: trimmedName,
    });
    onCreated(newCategory);
    onClose();
  };

  return (
    <>
      <ThemedText type="h3" style={{ fontFamily: typography.medium }}>
        {t("categories.createCategory")}
      </ThemedText>

      <TextInput
        bottomSheet
        label={t("categories.fields.name")}
        value={name}
        onChangeText={setName}
        placeholder={t("categories.placeholders.name")}
      />

      <View style={tw`flex-row justify-end gap-2`}>
        <Button
          label={t("cancel")}
          onPress={onClose}
          variant="text"
          size="small"
          disabled={createCategory.isPending}
        />
        <Button
          label={t("confirm")}
          onPress={handleSubmit}
          size="small"
          loading={createCategory.isPending}
          disabled={!name.trim()}
        />
      </View>
    </>
  );
}
