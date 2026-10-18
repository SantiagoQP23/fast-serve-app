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
      style={tw`p-4 bg-background `}
    >
      <ThemedView style={tw`w-full gap-2`}>
        <ThemedText type="h3" style={tw``}>
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
          containerStyle={tw`bg-transparent border-0 p-0`}
        />

        <ThemedView style={tw`flex-row justify-end gap-2`}>
          <Button
            leftIcon="check"
            onPress={handleConfirm}
            variant="secondary"
          />
        </ThemedView>
      </ThemedView>
    </BottomSheetView>
  );
};

export default EditNoteBottomSheet;
