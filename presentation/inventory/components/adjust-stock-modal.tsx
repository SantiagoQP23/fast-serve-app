import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import * as Haptics from "expo-haptics";
import { toast } from "sonner-native";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import Button from "@/presentation/theme/components/button";
import Chip from "@/presentation/theme/components/chip";
import Icon from "@/presentation/theme/components/icon";
import TextInput from "@/presentation/theme/components/text-input";
import Counter from "@/presentation/theme/components/counter";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import {
  DECREASE_REASONS,
  InventoryAdjustmentReason,
  InventoryMovementType,
} from "@/core/inventory/models/inventory-movement.model";
import {
  getSuggestedPurchaseQuantity,
  InventoryUnit,
  type InventoryItem,
} from "@/core/inventory/models/inventory-item.model";

type AdjustMode = "restock" | "decrease";

/** What a confirmed adjustment changed, for the snackbar and its undo. */
interface AdjustResult {
  item: InventoryItem;
  delta: number;
  quantityAfter: number;
}

/** Quick amounts added on top of the counter when restocking. */
const RESTOCK_STEPS = [5, 10];

const round = (value: number) => Number(value.toFixed(2));

interface AdjustStockModalProps {
  item: InventoryItem | null;
  initialMode?: AdjustMode;
  onClose: () => void;
}

export default function AdjustStockModal({
  item,
  initialMode = "restock",
  onClose,
}: AdjustStockModalProps) {
  const { t } = useTranslation("inventory");
  const { adjustStock } = useInventoryItems();
  const bottomSheetRef = useRef<BottomSheetMethods>(null);
  const visible = !!item;

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const formatQuantity = (quantity: number, unit: InventoryUnit) =>
    t("quantityWithUnit", {
      quantity,
      unit: t(`units.${unit}`, { count: quantity }),
    });

  // A routine save should feel certain: say what changed, and let a wrong
  // amount be taken back without doing the opposite adjustment by hand.
  const handleAdjusted = ({ item, delta, quantityAfter }: AdjustResult) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    let undone = false;

    const toastId = toast(
      t("adjust.stockChanged", {
        name: item.name,
        before: item.quantity,
        after: formatQuantity(quantityAfter, item.unit),
      }),
      {
        duration: 8000,
        action: {
          label: t("common:actions.undo"),
          onClick: async () => {
            if (undone) return;
            undone = true;
            toast.dismiss(toastId);
            try {
              await adjustStock.mutateAsync({
                inventoryItemId: item.id,
                delta: -delta,
                type:
                  delta > 0
                    ? InventoryMovementType.MANUAL_ADJUSTMENT
                    : InventoryMovementType.MANUAL_RESTOCK,
                reason: InventoryAdjustmentReason.CORRECTION,
              });
              toast(t("adjust.undone"));
            } catch {
              // The mutation already shows the error.
            }
          },
        },
      },
    );
  };

  return (
    <ThemedBottomSheetModal
      ref={bottomSheetRef}
      enablePanDownToClose
      onDismiss={onClose}
    >
      <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-5`}>
        {item && (
          <AdjustStockForm
            key={item.id}
            item={item}
            initialMode={initialMode}
            onClose={onClose}
            onAdjusted={handleAdjusted}
          />
        )}
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
}

interface AdjustStockFormProps {
  item: InventoryItem;
  initialMode: AdjustMode;
  onClose: () => void;
  onAdjusted: (result: AdjustResult) => void;
}

/** Restock opens on what's missing to reach the minimum; decrease on one unit. */
function getInitialAmount(item: InventoryItem, mode: AdjustMode) {
  if (mode === "restock") return getSuggestedPurchaseQuantity(item);
  return item.unit === InventoryUnit.UNIT && item.quantity >= 1 ? 1 : 0;
}

function AdjustStockForm({
  item,
  initialMode,
  onClose,
  onAdjusted,
}: AdjustStockFormProps) {
  const { t } = useTranslation("inventory");
  const { adjustStock } = useInventoryItems();
  const [mode, setMode] = useState<AdjustMode>(initialMode);
  // The counter is always the amount to add or take out, never the result.
  const [amount, setAmount] = useState(() =>
    getInitialAmount(item, initialMode),
  );
  const [reason, setReason] = useState<InventoryAdjustmentReason | null>(null);
  const [note, setNote] = useState("");

  const isDecrease = mode === "decrease";
  const step = item.unit === InventoryUnit.UNIT ? 1 : 0.1;
  const available = Math.max(item.quantity, 0);
  const delta = round(isDecrease ? -amount : amount);
  const newQuantity = round(item.quantity + delta);
  const canSubmit = amount > 0 && !adjustStock.isPending;
  const suggested = getSuggestedPurchaseQuantity(item);

  const formatQuantity = (quantity: number) =>
    t("quantityWithUnit", {
      quantity,
      unit: t(`units.${item.unit}`, { count: quantity }),
    });

  const switchToRestock = () => {
    setMode("restock");
    setAmount(getInitialAmount(item, "restock"));
    setReason(null);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      await adjustStock.mutateAsync({
        inventoryItemId: item.id,
        delta,
        type: isDecrease
          ? InventoryMovementType.MANUAL_ADJUSTMENT
          : InventoryMovementType.MANUAL_RESTOCK,
        reason: isDecrease ? (reason ?? undefined) : undefined,
        note: note.trim() || undefined,
      });
    } catch {
      // The mutation already shows the error; the sheet stays open to retry.
      return;
    }
    onClose();
    onAdjusted({ item, delta, quantityAfter: newQuantity });
  };

  const header = (
    <View style={tw`gap-1`}>
      <ThemedText type="h3" style={{ fontFamily: typography.medium }}>
        {t(mode)}
      </ThemedText>
      <ThemedText type="body2" style={tw`text-gray-500`} numberOfLines={1}>
        {item.name} · {t("currentStock")}: {formatQuantity(item.quantity)}
      </ThemedText>
    </View>
  );

  // Nothing to take out: say why right away and offer the way forward,
  // instead of a sheet full of disabled controls.
  if (isDecrease && available <= 0) {
    return (
      <>
        {header}
        <View style={tw`flex-row gap-3 rounded-md bg-surface p-4`}>
          <Icon
            name="info"
            size={20}
            color={tw.color("on-surface-variant")}
            style={tw`mt-0.5`}
          />
          <View style={tw`flex-1 gap-1`}>
            <ThemedText type="body1">
              {t("adjust.nothingToDecreaseTitle")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-on-surface-variant`}>
              {item.quantity < 0
                ? t("adjust.negativeStockReason")
                : t("adjust.emptyStockReason")}
            </ThemedText>
          </View>
        </View>
        <View style={tw`flex-row gap-2`}>
          <Button
            label={t("cancel")}
            onPress={onClose}
            variant="text"
            style={tw`flex-1`}
          />
          <Button
            label={t("restock")}
            leftIcon="plus"
            onPress={switchToRestock}
            style={tw`flex-1`}
          />
        </View>
      </>
    );
  }

  return (
    <>
      {header}

      <View style={tw`gap-2`}>
        <Counter
          value={amount}
          onChangeValue={setAmount}
          step={step}
          min={0}
          max={isDecrease ? available : undefined}
          unit={t(`units.${item.unit}`, { count: amount })}
        />
        <ThemedText
          type="body2"
          style={tw`text-gray-500 text-center`}
          accessibilityLiveRegion="polite"
        >
          {t("newStock")}: {formatQuantity(newQuantity)}
        </ThemedText>
      </View>

      {isDecrease ? (
        <View style={tw`gap-2`}>
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("adjust.reason")}
          </ThemedText>
          <View style={tw`flex-row flex-wrap gap-2`}>
            {DECREASE_REASONS.map((value) => (
              <Chip
                key={value}
                label={t(`adjust.reasons.${value}`)}
                selected={reason === value}
                onPress={() => setReason(reason === value ? null : value)}
              />
            ))}
          </View>
        </View>
      ) : (
        <View style={tw`flex-row flex-wrap gap-2`}>
          {suggested > 0 && (
            <Chip
              variant="suggestion"
              label={t("adjust.toMinimum", {
                amount: formatQuantity(suggested),
              })}
              selected={amount === suggested}
              onPress={() => setAmount(suggested)}
            />
          )}
          {RESTOCK_STEPS.map((value) => (
            <Chip
              key={value}
              variant="assist"
              label={`+${value}`}
              onPress={() => setAmount(round(amount + value))}
            />
          ))}
        </View>
      )}

      <TextInput
        bottomSheet
        label={t("reasonOptional")}
        value={note}
        onChangeText={setNote}
        placeholder={t(
          isDecrease ? "adjust.decreaseNotePlaceholder" : "reasonPlaceholder",
        )}
      />

      {/* The confirm label names the amount, so it gets the room */}
      <View style={tw`flex-row justify-center gap-2`}>
        <Button
          label={t("cancel")}
          onPress={onClose}
          variant="text"
          disabled={adjustStock.isPending}
        />
        <Button
          // Names the effect, so the last tap confirms what will happen
          label={
            amount > 0
              ? t(isDecrease ? "adjust.removeAmount" : "adjust.addAmount", {
                  amount: formatQuantity(amount),
                })
              : t(isDecrease ? "adjust.remove" : "adjust.add")
          }
          onPress={handleSubmit}
          loading={adjustStock.isPending}
          disabled={!canSubmit}
          style={tw`flex-1`}
        />
      </View>
    </>
  );
}
