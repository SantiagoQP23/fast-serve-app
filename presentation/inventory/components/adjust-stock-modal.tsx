import { useState } from "react";
import { Modal, View } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { InventoryMovementType } from "@/core/inventory/models/inventory-movement.model";
import type { InventoryItem } from "@/core/inventory/models/inventory-item.model";

interface AdjustStockModalProps {
  item: InventoryItem | null;
  onClose: () => void;
}

export default function AdjustStockModal({
  item,
  onClose,
}: AdjustStockModalProps) {
  return (
    <Modal
      transparent
      visible={!!item}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 bg-black/50 items-center justify-center px-6`}>
        {item && (
          <AdjustStockForm key={item.id} item={item} onClose={onClose} />
        )}
      </View>
    </Modal>
  );
}

interface AdjustStockFormProps {
  item: InventoryItem;
  onClose: () => void;
}

function AdjustStockForm({ item, onClose }: AdjustStockFormProps) {
  const { t } = useTranslation("inventory");
  const { adjustStock } = useInventoryItems();
  const [mode, setMode] = useState<"restock" | "waste">("restock");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = async () => {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

    await adjustStock.mutateAsync({
      inventoryItemId: item.id,
      delta: mode === "restock" ? parsedAmount : -parsedAmount,
      type:
        mode === "restock"
          ? InventoryMovementType.MANUAL_RESTOCK
          : InventoryMovementType.MANUAL_ADJUSTMENT,
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <View style={tw`bg-white rounded-2xl w-full p-6 shadow-lg gap-4`}>
      <ThemedText type="h3" style={{ fontFamily: typography.medium }}>
        {t("adjustStock")}
      </ThemedText>
      <ThemedText type="body2" style={tw`text-gray-500 -mt-2`}>
        {item.name} · {t("currentStock")}: {item.quantity}
      </ThemedText>

      <View style={tw`flex-row gap-2`}>
        <Button
          label={t("restock")}
          size="small"
          variant={mode === "restock" ? "primary" : "outline"}
          onPress={() => setMode("restock")}
          style={tw`flex-1`}
        />
        <Button
          label={t("waste")}
          size="small"
          variant={mode === "waste" ? "primary" : "outline"}
          onPress={() => setMode("waste")}
          style={tw`flex-1`}
        />
      </View>

      <TextInput
        label={t("amount")}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0"
      />

      <TextInput
        label={t("reasonOptional")}
        value={note}
        onChangeText={setNote}
        placeholder={t("reasonPlaceholder")}
      />

      <View style={tw`flex-row justify-end gap-2`}>
        <Button
          label={t("cancel")}
          onPress={onClose}
          variant="text"
          size="small"
          disabled={adjustStock.isPending}
        />
        <Button
          label={t("confirm")}
          onPress={handleSubmit}
          size="small"
          loading={adjustStock.isPending}
          disabled={!amount || Number(amount) <= 0}
        />
      </View>
    </View>
  );
}
