import { useRef, useState } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import tw from "../lib/tailwind";
import { ThemedBottomSheetModal } from "./themed-bottom-sheet-modal";
import { ThemedText } from "./themed-text";
import Button from "./button";
import TimeWheelPicker from "./time-wheel-picker";

function defaultFormat(
  totalMinutes: number,
  hoursUnit: string,
  minutesUnit: string,
) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} ${minutesUnit}`;
  if (minutes === 0) return `${hours} ${hoursUnit}`;
  return `${hours} ${hoursUnit} ${minutes} ${minutesUnit}`;
}

export type TimeSelectorProps = {
  label?: string;
  pickerTitle?: string;
  pickerDescription?: string;
  doneLabel?: string;
  value: number;
  onChange: (minutes: number) => void;
  onDone?: (minutes: number) => void | Promise<void>;
  minMinutes?: number;
  maxMinutes: number;
  icon?: keyof typeof Ionicons.glyphMap;
  editable?: boolean;
  hoursUnit?: string;
  minutesUnit?: string;
  formatValue?: (minutes: number) => string;
};

export default function TimeSelector({
  label,
  pickerTitle,
  pickerDescription,
  doneLabel = "Done",
  value,
  onChange,
  onDone,
  minMinutes = 1,
  maxMinutes,
  icon = "time-outline",
  editable = true,
  hoursUnit = "h",
  minutesUnit = "min",
  formatValue,
}: TimeSelectorProps) {
  const sheetRef = useRef<BottomSheetMethods>(null);
  const [saving, setSaving] = useState(false);

  const handleOpen = () => {
    if (!editable) return;
    sheetRef.current?.present();
  };

  const handleDone = async () => {
    if (onDone) {
      setSaving(true);
      try {
        await onDone(value);
      } finally {
        setSaving(false);
      }
    }
    sheetRef.current?.dismiss();
  };

  const display = formatValue
    ? formatValue(value)
    : defaultFormat(value, hoursUnit, minutesUnit);

  return (
    <View>
      <Button
        variant="text"
        label={display}
        leftIcon={icon}
        rightIcon="chevron-down"
        onPress={handleOpen}
        disabled={!editable}
        size="small"
      />

      <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6`}>
          <ThemedText type="h3" style={pickerDescription ? tw`mb-1` : tw`mb-4`}>
            {pickerTitle ?? label}
          </ThemedText>
          {pickerDescription && (
            <ThemedText type="small" style={tw`text-gray-500 mb-4`}>
              {pickerDescription}
            </ThemedText>
          )}
          <TimeWheelPicker
            value={value}
            onChange={onChange}
            minMinutes={minMinutes}
            maxMinutes={maxMinutes}
            hoursUnit={hoursUnit}
            minutesUnit={minutesUnit}
            hoursAccessibilityLabel={hoursUnit}
            minutesAccessibilityLabel={minutesUnit}
          />
          <View style={tw`mt-6`}>
            <Button
              label={doneLabel}
              onPress={handleDone}
              loading={saving}
              disabled={saving}
            />
          </View>
        </BottomSheetView>
      </ThemedBottomSheetModal>
    </View>
  );
}
