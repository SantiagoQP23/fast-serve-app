import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { useMenuManagement } from "@/presentation/menu-management/hooks/useMenuManagement";
import type { ProductOption } from "@/core/menu/models/product-optionl.model";

export interface EditVariantSheetRef {
  present: (option: ProductOption) => void;
}

/** Edits a variant's name and price. */
const EditVariantSheet = forwardRef<EditVariantSheetRef, { productId: string }>(
  function EditVariantSheet({ productId }, ref) {
    const { t } = useTranslation("menuManagement");
    const { updateProductOption } = useMenuManagement();
    const sheetRef = useRef<BottomSheetMethods>(null);
    const [option, setOption] = useState<ProductOption | null>(null);
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [error, setError] = useState("");

    useImperativeHandle(ref, () => ({
      present: (next) => {
        setOption(next);
        setName(next.name);
        setPrice(String(next.price));
        setError("");
        sheetRef.current?.present();
      },
    }));

    const handleSave = () => {
      if (!option) return;
      const trimmedName = name.trim();
      const parsedPrice = Number(price);

      if (!trimmedName) {
        setError(t("products.variants.validations.nameRequired"));
        return;
      }
      if (!price || Number.isNaN(parsedPrice) || parsedPrice < 0) {
        setError(t("products.variants.validations.priceInvalid"));
        return;
      }
      setError("");

      updateProductOption.mutate(
        {
          id: option.id,
          productId,
          name: trimmedName,
          price: parsedPrice,
        },
        {
          onSuccess: () => sheetRef.current?.dismiss(),
        },
      );
    };

    return (
      <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
          <ThemedText type="h3">
            {t("products.variants.editVariant")}
          </ThemedText>

          <TextInput
            bottomSheet
            label={t("products.variants.fields.name")}
            placeholder={t("products.variants.placeholders.name")}
            value={name}
            onChangeText={setName}
          />

          <TextInput
            bottomSheet
            label={t("products.variants.fields.price")}
            placeholder={t("products.variants.placeholders.price")}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />

          {error ? (
            <ThemedText type="small" style={tw`text-red-500`}>
              {error}
            </ThemedText>
          ) : null}

          <ThemedView style={tw`flex-row gap-4 items-center justify-end`}>
            <Button
              label={t("products.save")}
              onPress={handleSave}
              loading={updateProductOption.isPending}
              disabled={updateProductOption.isPending}
            />
          </ThemedView>
        </BottomSheetView>
      </ThemedBottomSheetModal>
    );
  },
);

export default EditVariantSheet;
