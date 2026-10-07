import { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { useState } from "react";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import Button from "@/presentation/theme/components/button";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import PeopleSelector from "./people-selector";
import { useNewOrderStore } from "../store/newOrderStore";

interface NewOrderPeopleBottomSheetProps {
  onClose?: () => void;
}

const NewOrderPeopleBottomSheet = ({
  onClose,
}: NewOrderPeopleBottomSheetProps) => {
  const { t } = useTranslation(["common", "orders"]);
  const people = useNewOrderStore((state) => state.people);
  const setPeople = useNewOrderStore((state) => state.setPeople);
  const [localPeople, setLocalPeople] = useState(people);

  const handleConfirm = () => {
    setPeople(localPeople);
    onClose?.();
  };

  return (
    <BottomSheetView
      style={tw`p-4 bg-light-background dark:bg-dark-background`}
    >
      <ThemedView style={tw`w-full gap-6`}>
        <ThemedText type="h3">{t("orders:options.editPeople")}</ThemedText>

        <PeopleSelector value={localPeople} onChange={setLocalPeople} />

        <ThemedView style={tw`flex-row justify-end gap-2`}>
          <Button
            leftIcon="save-outline"
            label={t("common:actions.confirm")}
            onPress={handleConfirm}
          />
        </ThemedView>
      </ThemedView>
    </BottomSheetView>
  );
};

export default NewOrderPeopleBottomSheet;
