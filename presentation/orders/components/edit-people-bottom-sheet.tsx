import { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { useState } from "react";
import { Order } from "@/core/orders/models/order.model";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import Button from "@/presentation/theme/components/button";
import { useOrders } from "../hooks/useOrders";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import PeopleSelector from "./people-selector";

interface EditPeopleBottomSheetProps {
  order: Order;
  onClose?: () => void;
}

const EditPeopleBottomSheet = ({
  order,
  onClose,
}: EditPeopleBottomSheetProps) => {
  const { t } = useTranslation(["common", "orders"]);
  const { mutate: updateOrder, isLoading } = useOrders().updateOrder;
  const [people, setPeople] = useState(order.people);

  const handleConfirm = () => {
    if (people === order.people) {
      onClose?.();
      return;
    }

    updateOrder(
      { id: order.id, people },
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
        <ThemedText type="h3" style={tw``}>
          {t("orders:options.editPeople")}
        </ThemedText>

        <PeopleSelector value={people} onChange={setPeople} />

        <ThemedView style={tw`flex-row justify-end gap-2`}>
          <Button
            leftIcon="save-outline"
            label={t("common:actions.confirm")}
            onPress={handleConfirm}
            loading={isLoading}
          />
        </ThemedView>
      </ThemedView>
    </BottomSheetView>
  );
};

export default EditPeopleBottomSheet;
