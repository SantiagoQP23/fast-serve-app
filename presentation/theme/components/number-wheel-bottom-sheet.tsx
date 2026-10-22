import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { View } from "react-native";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";

import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import tw from "../lib/tailwind";
import { ThemedBottomSheetModal } from "./themed-bottom-sheet-modal";
import { ThemedText } from "./themed-text";
import Button from "./button";
import {
  BAND_TOP,
  ITEM_HEIGHT,
  WHEEL_HEIGHT,
  WheelColumn,
  range,
} from "./wheel-column";

const COLUMN_WIDTH = 160;

export type NumberWheelBottomSheetRef = {
  present: () => void;
  dismiss: () => void;
};

interface NumberWheelBottomSheetProps {
  title: string;
  value: number;
  min?: number;
  /** Stretched to `value` when it's higher, so the wheel can still show it. */
  max: number;
  onDone: (value: number) => void;
}

/** Picks a whole number on a wheel, committed on Done. */
const NumberWheelBottomSheet = forwardRef<
  NumberWheelBottomSheetRef,
  NumberWheelBottomSheetProps
>(({ title, value, min = 1, max, onDone }, ref) => {
  const { t } = useTranslation("common");
  const sheetRef = useRef<BottomSheetMethods>(null);
  const options = useMemo(
    () => range(min, Math.max(max, value)),
    [min, max, value],
  );
  // The wheel starts at `min` when there's no value yet, so Done commits that
  const initial = options.includes(value) ? value : options[0];
  const [pending, setPending] = useState(initial);

  useImperativeHandle(ref, () => ({
    present: () => {
      setPending(initial);
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const handleDone = () => {
    onDone(pending);
    sheetRef.current?.dismiss();
  };

  return (
    <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
      <BottomSheetView style={tw`px-4 pb-6`}>
        <ThemedText type="h3" style={tw`mb-4`}>
          {title}
        </ThemedText>
        <View style={tw`items-center rounded-3xl p-4`}>
          <View style={{ width: COLUMN_WIDTH, height: WHEEL_HEIGHT }}>
            <View
              pointerEvents="none"
              style={[
                tw`absolute left-0 right-0 bg-secondary rounded-md`,
                { top: BAND_TOP, height: ITEM_HEIGHT },
              ]}
            />
            <WheelColumn
              data={options}
              index={Math.max(options.indexOf(pending), 0)}
              onSettle={(index) => setPending(options[index])}
              formatLabel={(count) => String(count)}
              accessibilityLabel={title}
              width={COLUMN_WIDTH}
            />
          </View>
        </View>
        <View style={tw`mt-6`}>
          <Button label={t("actions.done")} onPress={handleDone} />
        </View>
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
});

NumberWheelBottomSheet.displayName = "NumberWheelBottomSheet";

export default NumberWheelBottomSheet;
