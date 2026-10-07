import { useRef } from "react";
import { Pressable, View } from "react-native";
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

const CONTAINER_HEIGHT = 56;

function defaultFormat(totalMinutes: number, hoursUnit: string, minutesUnit: string) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} ${minutesUnit}`;
  if (minutes === 0) return `${hours} ${hoursUnit}`;
  return `${hours} ${hoursUnit} ${minutes} ${minutesUnit}`;
}

export type TimeSelectorProps = {
  label?: string;
  pickerTitle?: string;
  doneLabel?: string;
  value: number;
  onChange: (minutes: number) => void;
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
  doneLabel = "Done",
  value,
  onChange,
  minMinutes = 1,
  maxMinutes,
  icon = "time-outline",
  editable = true,
  hoursUnit = "h",
  minutesUnit = "min",
  formatValue,
}: TimeSelectorProps) {
  const sheetRef = useRef<BottomSheetMethods>(null);

  const handleOpen = () => {
    if (!editable) return;
    sheetRef.current?.present();
  };

  const display = formatValue
    ? formatValue(value)
    : defaultFormat(value, hoursUnit, minutesUnit);

  return (
    <View>
      <Pressable
        onPress={handleOpen}
        disabled={!editable}
        style={tw.style(
          "flex-row items-center rounded-3xl px-3 bg-light-surface-high",
          !editable && "opacity-50",
        )}
      >
        <Ionicons
          name={icon}
          size={18}
          style={{ marginRight: 10, marginLeft: 4 }}
          color={tw.color("light-on-surface-variant")}
        />
        <View style={{ flex: 1, minHeight: CONTAINER_HEIGHT, justifyContent: "center" }}>
          {label && (
            <ThemedText type="small" style={tw`text-light-on-surface-variant mb-0.5`}>
              {label}
            </ThemedText>
          )}
          <ThemedText type="body1">{display}</ThemedText>
        </View>
        {editable && (
          <Ionicons
            name="chevron-down"
            size={18}
            style={{ marginRight: 4 }}
            color={tw.color("light-on-surface-variant")}
          />
        )}
      </Pressable>

      <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6`}>
          <ThemedText type="h3" style={tw`mb-4`}>
            {pickerTitle ?? label}
          </ThemedText>
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
            <Button label={doneLabel} onPress={() => sheetRef.current?.dismiss()} />
          </View>
        </BottomSheetView>
      </ThemedBottomSheetModal>
    </View>
  );
}
