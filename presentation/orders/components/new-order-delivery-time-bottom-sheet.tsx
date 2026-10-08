import { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { useState } from "react";
import { Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import Button from "@/presentation/theme/components/button";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useNewOrderStore } from "../store/newOrderStore";

interface NewOrderDeliveryTimeBottomSheetProps {
  onClose?: () => void;
}

const NewOrderDeliveryTimeBottomSheet = ({
  onClose,
}: NewOrderDeliveryTimeBottomSheetProps) => {
  const { t } = useTranslation(["common", "orders"]);
  const deliveryTime = useNewOrderStore((state) => state.deliveryTime);
  const setDeliveryTime = useNewOrderStore((state) => state.setDeliveryTime);
  const [pickerValue, setPickerValue] = useState(deliveryTime ?? new Date());

  // On iOS the spinner stays inline and fires onChange continuously as the
  // user scrolls, so we only track the selection locally and commit it on
  // "Confirm". Android's native dialog is a single-shot pick that commits
  // and closes immediately.
  const handleChange = (_: unknown, selectedDate?: Date) => {
    if (!selectedDate) return;

    setPickerValue(selectedDate);

    if (Platform.OS === "android") {
      setDeliveryTime(selectedDate);
      onClose?.();
    }
  };

  const handleConfirm = () => {
    setDeliveryTime(pickerValue);
    onClose?.();
  };

  const handleRemove = () => {
    setDeliveryTime(null);
    onClose?.();
  };

  return (
    <BottomSheetView
      style={tw`p-4 bg-light-background dark:bg-dark-background`}
    >
      <ThemedView style={tw`w-full gap-6`}>
        <ThemedText type="h3">{t("orders:form.deliveryTime")}</ThemedText>

        {Platform.OS === "ios" ? (
          <ThemedView
            style={tw`border border-gray-300 rounded-2xl overflow-hidden`}
          >
            <DateTimePicker
              value={pickerValue}
              mode="time"
              display="spinner"
              onChange={handleChange}
            />
          </ThemedView>
        ) : (
          <DateTimePicker
            value={pickerValue}
            mode="time"
            is24Hour
            display="default"
            onChange={handleChange}
          />
        )}

        <ThemedView style={tw`flex-row justify-between items-center gap-2`}>
          {deliveryTime ? (
            <Button
              variant="text"
              label={t("common:actions.remove")}
              onPress={handleRemove}
            />
          ) : (
            <ThemedView />
          )}
          {Platform.OS === "ios" && (
            <Button
              leftIcon="save-outline"
              label={t("common:actions.confirm")}
              onPress={handleConfirm}
            />
          )}
        </ThemedView>
      </ThemedView>
    </BottomSheetView>
  );
};

export default NewOrderDeliveryTimeBottomSheet;
