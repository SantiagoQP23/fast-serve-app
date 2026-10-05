import { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { useState } from "react";
import { Order } from "@/core/orders/models/order.model";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import TextInput from "@/presentation/theme/components/text-input";
import Button from "@/presentation/theme/components/button";
import { useOrders } from "../hooks/useOrders";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

interface EditNoteBottomSheetProps {
  order: Order;
  onClose?: () => void;
}

const EditNoteBottomSheet = ({ order, onClose }: EditNoteBottomSheetProps) => {
  const { t } = useTranslation(["common", "orders"]);
  const { mutate: updateOrder, isLoading } = useOrders().updateOrder;
  const [notes, setNotes] = useState(order.notes || "");

  const handleConfirm = () => {
    if (notes === (order.notes || "")) {
      onClose?.();
      return;
    }

    updateOrder(
      { id: order.id, notes },
      {
        onSuccess: () => {
          onClose?.();
        },
      },
    );
  };

  return (
    <BottomSheetView
      style={tw`p-4 bg-light-background dark:bg-dark-background`}
    >
      <ThemedView style={tw`w-full gap-6`}>
        <ThemedText type="h3" style={tw`text-center`}>
          {t("common:labels.notes")}
        </ThemedText>

        <TextInput
          numberOfLines={5}
          multiline
          bottomSheet
          autoFocus
          placeholder={t("orders:newOrder.notesPlaceholder")}
          value={notes}
          onChangeText={setNotes}
        />

        <Button
          label={t("common:actions.confirm")}
          onPress={handleConfirm}
          loading={isLoading}
        />
      </ThemedView>
    </BottomSheetView>
  );
};

export default EditNoteBottomSheet;
