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
  onDone?: (hour: number) => void | Promise<void>;
  formatLabel?: (hour: number) => string;
  accessibilityLabel?: string;
};

const HourWheelBottomSheet = forwardRef<
  HourWheelBottomSheetRef,
  HourWheelBottomSheetProps
>(
  (
    { title, doneLabel = "Done", value, onDone, formatLabel, accessibilityLabel },
    ref,
  ) => {
    const sheetRef = useRef<BottomSheetMethods>(null);
    const [saving, setSaving] = useState(false);
    // Scrolling the wheel only updates this local, in-sheet value — the
    // screen behind the sheet keeps showing the saved hour until Done
    // succeeds, not whatever the wheel is currently resting on.
    const [pendingHour, setPendingHour] = useState(value);

    useImperativeHandle(ref, () => ({
      present: () => {
        setPendingHour(value);
        sheetRef.current?.present();
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const handleDone = async () => {
      if (onDone) {
        setSaving(true);
        try {
          await onDone(pendingHour);
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
            value={pendingHour}
            onChange={setPendingHour}
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
