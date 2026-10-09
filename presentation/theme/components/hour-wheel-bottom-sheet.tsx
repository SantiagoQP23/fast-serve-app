import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { View } from "react-native";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import tw from "../lib/tailwind";
import { ThemedBottomSheetModal } from "./themed-bottom-sheet-modal";
import { ThemedText } from "./themed-text";
import Button from "./button";
import HourWheelPicker from "./hour-wheel-picker";

export type HourWheelBottomSheetRef = {
  present: () => void;
  dismiss: () => void;
};

export type HourWheelBottomSheetProps = {
  title?: string;
  doneLabel?: string;
  value: number;
  onChange: (hour: number) => void;
  onDone?: (hour: number) => void | Promise<void>;
  formatLabel?: (hour: number) => string;
  accessibilityLabel?: string;
};

const HourWheelBottomSheet = forwardRef<
  HourWheelBottomSheetRef,
  HourWheelBottomSheetProps
>(
  (
    {
      title,
      doneLabel = "Done",
      value,
      onChange,
      onDone,
      formatLabel,
      accessibilityLabel,
    },
    ref,
  ) => {
    const sheetRef = useRef<BottomSheetMethods>(null);
    const [saving, setSaving] = useState(false);

    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
      dismiss: () => sheetRef.current?.dismiss(),
    }));

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

    return (
      <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6`}>
          {title && (
            <ThemedText type="h3" style={tw`mb-4`}>
              {title}
            </ThemedText>
          )}
          <HourWheelPicker
            value={value}
            onChange={onChange}
            formatLabel={formatLabel}
            accessibilityLabel={accessibilityLabel}
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
    );
  },
);

HourWheelBottomSheet.displayName = "HourWheelBottomSheet";

export default HourWheelBottomSheet;
