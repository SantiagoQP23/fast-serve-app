import { useRef, useState, type ReactNode } from "react";
import { Platform, Pressable, View } from "react-native";
import dayjs from "dayjs";
import DateTimePicker from "@react-native-community/datetimepicker";
import { toast } from "sonner-native";

import { OrderType } from "@/core/orders/enums/order-type.enum";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { typography } from "@/constants/theme";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import { useNewOrderStore } from "../store/newOrderStore";
import PeopleSelector from "./people-selector";
import TableSelectorBottomSheet, {
  type TableSelectorBottomSheetRef,
} from "./table-selector-bottom-sheet";

interface InfoFieldProps {
  label: string;
  value?: string;
  placeholder: string;
  icon?: IconName;
  onPress: () => void;
  /** Replaces the trailing chevron, e.g. a clear button. */
  trailing?: ReactNode;
}

/** A tappable field that looks like an outlined `Select`. */
function InfoField({
  label,
  value,
  placeholder,
  icon = "chevron-down",
  onPress,
  trailing,
}: InfoFieldProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        tw`flex-row items-center rounded-md px-3 py-2 border min-h-14`,
        { borderColor: pressed ? tw.color("primary") : tw.color("border") },
      ]}
    >
      <View style={tw`flex-1 gap-0.5 ml-1`}>
        <ThemedText
          numberOfLines={1}
          style={{
            fontSize: 11,
            fontFamily: typography.medium,
            color: tw.color("gray-500"),
          }}
        >
          {label}
        </ThemedText>
        <ThemedText
          numberOfLines={1}
          style={{
            fontSize: 16,
            fontFamily: typography.medium,
            color: value ? tw.color("text") : tw.color("on-surface-variant"),
          }}
        >
          {value ?? placeholder}
        </ThemedText>
      </View>
      {trailing ?? (
        <Icon
          name={icon}
          size={18}
          style={tw`ml-2`}
          color={tw.color("on-surface-variant")}
        />
      )}
    </Pressable>
  );
}

/**
 * The order being built in the cart, edited in place: every change goes
 * straight to the new-order store, so there's nothing to save.
 */
export default function CartInformation() {
  const { t } = useTranslation(["common", "menu", "orders"]);
  const orderType = useNewOrderStore((state) => state.orderType);
  const table = useNewOrderStore((state) => state.table);
  const setTable = useNewOrderStore((state) => state.setTable);
  const people = useNewOrderStore((state) => state.people);
  const setPeople = useNewOrderStore((state) => state.setPeople);
  const notes = useNewOrderStore((state) => state.notes);
  const setNotes = useNewOrderStore((state) => state.setNotes);
  const deliveryTime = useNewOrderStore((state) => state.deliveryTime);
  const setDeliveryTime = useNewOrderStore((state) => state.setDeliveryTime);

  const tableSelectorSheetRef = useRef<TableSelectorBottomSheetRef>(null);

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerValue, setPickerValue] = useState(new Date());

  const openTimePicker = () => {
    setPickerValue(deliveryTime ?? new Date());
    setShowTimePicker(true);
  };

  const commitDeliveryTime = (selectedDate: Date) => {
    if (!dayjs(selectedDate).isAfter(dayjs())) {
      toast.error(t("orders:alerts.deliveryTimeInPast"));
      return;
    }
    setDeliveryTime(selectedDate);
    setShowTimePicker(false);
  };

  // On iOS the spinner stays inline and fires onChange continuously as the
  // user scrolls, so we only track the selection locally and commit it on
  // "Confirm". Android's native dialog is a single-shot pick that commits
  // and closes immediately.
  const handleTimeChange = (_: unknown, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowTimePicker(false);
    if (!selectedDate) return;

    setPickerValue(selectedDate);

    if (Platform.OS === "android") commitDeliveryTime(selectedDate);
  };

  return (
    <ThemedView style={tw`gap-6`}>
      {orderType === OrderType.IN_PLACE && (
        <InfoField
          label={t("common:labels.table")}
          value={table ? table.name : undefined}
          placeholder={t("orders:newOrder.selectTable")}
          onPress={() => tableSelectorSheetRef.current?.present()}
        />
      )}

      <ThemedView style={tw`gap-2`}>
        <ThemedText type="body2" style={tw`text-gray-500`}>
          {t("orders:form.people")}
        </ThemedText>
        <PeopleSelector value={people} onChange={setPeople} />
      </ThemedView>

      <ThemedView style={tw`gap-2`}>
        <InfoField
          label={t("orders:form.deliveryTime")}
          value={deliveryTime ? dayjs(deliveryTime).format("HH:mm") : undefined}
          placeholder={t("orders:form.addDeliveryTime")}
          icon="clock"
          onPress={openTimePicker}
          trailing={
            deliveryTime ? (
              <Pressable
                onPress={() => setDeliveryTime(null)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t("common:actions.clear")}
                style={tw`ml-2`}
              >
                <Icon name="x" size={18} color={tw.color("gray-600")} />
              </Pressable>
            ) : undefined
          }
        />
        {showTimePicker && Platform.OS === "ios" && (
          <ThemedView
            style={tw`border border-gray-300 rounded-2xl overflow-hidden`}
          >
            <DateTimePicker
              value={pickerValue}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
            />
            <Button
              label={t("common:actions.confirm")}
              onPress={() => commitDeliveryTime(pickerValue)}
              variant="primary"
              size="small"
            />
          </ThemedView>
        )}
        {showTimePicker && Platform.OS === "android" && (
          <DateTimePicker
            value={pickerValue}
            mode="time"
            is24Hour
            display="default"
            onChange={handleTimeChange}
          />
        )}
      </ThemedView>

      <TextInput
        label={t("menu:cart.notes")}
        placeholder={t("orders:newOrder.notesPlaceholder")}
        multiline
        numberOfLines={4}
        scrollEnabled
        style={tw`max-h-32`}
        value={notes}
        onChangeText={setNotes}
      />

      <TableSelectorBottomSheet
        ref={tableSelectorSheetRef}
        selectedTableId={table?.id}
        onSelectTable={setTable}
      />
    </ThemedView>
  );
}
