import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import Button from "@/presentation/theme/components/button";
import Counter from "@/presentation/theme/components/counter";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import {
  InventoryUnit,
  type InventoryItem,
} from "@/core/inventory/models/inventory-item.model";

interface CountQuantityModalProps {
  /** Item being counted; its `quantity` is the current system stock. */
  item: InventoryItem | null;
  loading?: boolean;
  onConfirm: (countedQuantity: number) => void | Promise<void>;
  onClose: () => void;
}

/** Bottom sheet to enter how much of an item was actually found. */
export default function CountQuantityModal({
  item,
  loading = false,
  onConfirm,
  onClose,
}: CountQuantityModalProps) {
  const bottomSheetRef = useRef<BottomSheetMethods>(null);
  const visible = !!item;

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
        {item && (
          <CountQuantityForm
            key={item.id}
            item={item}
            loading={loading}
            onConfirm={onConfirm}
            onClose={onClose}
          />
        )}
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
}

function CountQuantityForm({
  item,
  loading,
  onConfirm,
  onClose,
}: Required<Omit<CountQuantityModalProps, "item">> & {
  item: InventoryItem;
}) {
  const { t } = useTranslation("inventory");
  const systemQuantity = Math.max(item.quantity, 0);
  const [quantity, setQuantity] = useState(systemQuantity);
  const step = item.unit === InventoryUnit.UNIT ? 1 : 0.1;
  const unit = t(`units.${item.unit}`);
  const difference = Number((quantity - item.quantity).toFixed(3));

  return (
    <>
      <View style={tw`gap-1`}>
        <ThemedText type="h3" style={{ fontFamily: typography.medium }}>
          {item.name}
        </ThemedText>
        <ThemedText type="body2" style={tw`text-gray-500`}>
          {t("counts.quantityFound")}
        </ThemedText>
      </View>

      <View style={tw`gap-2`}>
        <Counter
          value={quantity}
          onChangeValue={setQuantity}
          step={step}
          min={0}
          unit={unit}
        />
        <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
          {t("counts.systemQuantity", { quantity: item.quantity, unit })}
          {" · "}
          {t("counts.difference", {
            difference: difference > 0 ? `+${difference}` : difference,
            unit,
          })}
        </ThemedText>
      </View>

      <View style={tw`flex-row justify-center gap-2`}>
        <Button
          label={t("cancel")}
          onPress={onClose}
          variant="text"
          disabled={loading}
          style={tw`flex-1`}
        />
        <Button
          label={t("counts.saveQuantity")}
          onPress={() => onConfirm(quantity)}
          loading={loading}
          style={tw`flex-1`}
        />
      </View>
    </>
  );
}
