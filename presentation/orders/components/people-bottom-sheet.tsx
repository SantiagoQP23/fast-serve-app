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
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import Button from "@/presentation/theme/components/button";
import {
  BAND_TOP,
  ITEM_HEIGHT,
  WHEEL_HEIGHT,
  WheelColumn,
  range,
} from "@/presentation/theme/components/wheel-column";

const MAX_PEOPLE = 25;
const COLUMN_WIDTH = 160;

export type PeopleBottomSheetRef = {
  present: () => void;
  dismiss: () => void;
};

interface PeopleBottomSheetProps {
  value: number;
  onDone: (people: number) => void;
}

/** Picks how many people the order is for on a wheel, committed on Done. */
const PeopleBottomSheet = forwardRef<
  PeopleBottomSheetRef,
  PeopleBottomSheetProps
>(({ value, onDone }, ref) => {
  const { t } = useTranslation(["common", "orders"]);
  const sheetRef = useRef<BottomSheetMethods>(null);
  const options = useMemo(() => range(1, MAX_PEOPLE), []);
  const [pending, setPending] = useState(value);

  useImperativeHandle(ref, () => ({
    present: () => {
      setPending(value);
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
          {t("orders:form.people")}
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
              accessibilityLabel={t("orders:form.people")}
              width={COLUMN_WIDTH}
            />
          </View>
        </View>
        <View style={tw`mt-6`}>
          <Button label={t("common:actions.done")} onPress={handleDone} />
        </View>
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
});

PeopleBottomSheet.displayName = "PeopleBottomSheet";

export default PeopleBottomSheet;
