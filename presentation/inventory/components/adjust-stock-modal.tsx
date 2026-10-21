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
import Counter from "@/presentation/theme/components/counter";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { InventoryMovementType } from "@/core/inventory/models/inventory-movement.model";
import {
  InventoryUnit,
  type InventoryItem,
} from "@/core/inventory/models/inventory-item.model";

interface AdjustStockModalProps {
  item: InventoryItem | null;
  initialMode?: "restock" | "decrease";
  onClose: () => void;
}

export default function AdjustStockModal({
  item,
  initialMode = "restock",
  onClose,
}: AdjustStockModalProps) {
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
          <AdjustStockForm
            key={item.id}
            item={item}
            mode={initialMode}
            onClose={onClose}
          />
        )}
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
}

interface AdjustStockFormProps {
  item: InventoryItem;
  mode: "restock" | "decrease";
  onClose: () => void;
}

function AdjustStockForm({ item, mode, onClose }: AdjustStockFormProps) {
  const { t } = useTranslation("inventory");
  const { adjustStock } = useInventoryItems();
  const isDecrease = mode === "decrease";
  // Restock: the counter is the amount to add. Decrease: the counter starts at
  // the current quantity and is the resulting stock.
  const [value, setValue] = useState(() =>
    isDecrease ? Math.max(item.quantity, 0) : 0,
  );
  const [note, setNote] = useState("");
  const step = item.unit === InventoryUnit.UNIT ? 1 : 0.1;
  const delta = Number((isDecrease ? value - item.quantity : value).toFixed(2));
  const newQuantity = Number((item.quantity + delta).toFixed(2));
  const canSubmit = isDecrease ? delta < 0 : delta > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    await adjustStock.mutateAsync({
      inventoryItemId: item.id,
      delta,
      type:
        mode === "restock"
          ? InventoryMovementType.MANUAL_RESTOCK
          : InventoryMovementType.MANUAL_ADJUSTMENT,
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <>
      <ThemedText type="h3" style={{ fontFamily: typography.medium }}>
        {t(mode)}
      </ThemedText>

      <View style={tw`gap-2`}>
        <Counter
          value={value}
          onChangeValue={setValue}
          step={step}
          min={0}
          max={isDecrease ? Math.max(item.quantity, 0) : undefined}
          unit={t(`units.${item.unit}`, { count: value })}
        />
        <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
          {t(isDecrease ? "currentStock" : "newStock")}:{" "}
          {t("quantityWithUnit", {
            quantity: isDecrease ? item.quantity : newQuantity,
            unit: t(`units.${item.unit}`, {
              count: isDecrease ? item.quantity : newQuantity,
            }),
          })}
        </ThemedText>
      </View>

      <TextInput
        bottomSheet
        label={t("reasonOptional")}
        value={note}
        onChangeText={setNote}
        placeholder={t("reasonPlaceholder")}
      />

      <View style={tw`flex-row justify-center gap-2`}>
        <Button
          label={t("cancel")}
          onPress={onClose}
          variant="text"
          disabled={adjustStock.isPending}
          style={tw`flex-1`}
        />
        <Button
          label={t("confirm")}
          onPress={handleSubmit}
          loading={adjustStock.isPending}
          disabled={!canSubmit}
          style={tw`flex-1`}
        />
      </View>
    </>
  );
}
