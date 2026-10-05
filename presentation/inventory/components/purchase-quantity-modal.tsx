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

export interface PurchaseQuantityTarget {
  item: InventoryItem;
  /** Quantity the counter starts at (0 when adding a new line). */
  quantity: number;
  /** Stock the item would have without this line — the preview adds to it. */
  baseStock: number;
}

interface PurchaseQuantityModalProps {
  target: PurchaseQuantityTarget | null;
  loading?: boolean;
  onConfirm: (quantity: number) => void | Promise<void>;
  onClose: () => void;
}

/** Bottom sheet to pick how much of an item was received. */
export default function PurchaseQuantityModal({
  target,
  loading = false,
  onConfirm,
  onClose,
}: PurchaseQuantityModalProps) {
  const bottomSheetRef = useRef<BottomSheetMethods>(null);
  const visible = !!target;

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
        {target && (
          <PurchaseQuantityForm
            key={target.item.id}
            target={target}
            loading={loading}
            onConfirm={onConfirm}
            onClose={onClose}
          />
        )}
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
}

function PurchaseQuantityForm({
  target,
  loading,
  onConfirm,
  onClose,
}: Required<Omit<PurchaseQuantityModalProps, "target">> & {
  target: PurchaseQuantityTarget;
}) {
  const { t } = useTranslation("inventory");
  const { item, baseStock } = target;
  const [quantity, setQuantity] = useState(target.quantity);
  const step = item.unit === InventoryUnit.UNIT ? 1 : 0.1;
  const unit = t(`units.${item.unit}`);
  const newStock = Number((baseStock + quantity).toFixed(3));

  return (
    <>
      <View style={tw`gap-1`}>
        <ThemedText type="h3" style={{ fontFamily: typography.medium }}>
          {item.name}
        </ThemedText>
        <ThemedText type="body2" style={tw`text-gray-500`}>
          {t("purchases.quantityReceived")}
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
          {t("purchases.stockChange", {
            before: Number(baseStock.toFixed(3)),
            after: newStock,
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
          label={t("confirm")}
          onPress={() => onConfirm(quantity)}
          loading={loading}
          disabled={quantity <= 0}
          style={tw`flex-1`}
        />
      </View>
    </>
  );
}
