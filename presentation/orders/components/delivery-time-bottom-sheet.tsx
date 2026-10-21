import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import dayjs from "dayjs";
import { toast } from "sonner-native";

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

const COLUMN_WIDTH = 108;
const MINUTE_STEP = 5;

const pad = (n: number) => String(n).padStart(2, "0");

/** The given time snapped to the minute steps, or the next slot from now. */
function initialTime(value: Date | null) {
  if (value) {
    const hours = value.getHours();
    const minutes = Math.round(value.getMinutes() / MINUTE_STEP) * MINUTE_STEP;
    return minutes === 60
      ? { hours: (hours + 1) % 24, minutes: 0 }
      : { hours, minutes };
  }
  const next = dayjs()
    .add(MINUTE_STEP - (dayjs().minute() % MINUTE_STEP), "minute")
    .startOf("minute");
  return { hours: next.hour(), minutes: next.minute() };
}

export type DeliveryTimeBottomSheetRef = {
  present: () => void;
  dismiss: () => void;
};

interface DeliveryTimeBottomSheetProps {
  value: Date | null;
  onChange: (time: Date | null) => void;
}

/** Picks today's delivery time on hour/minute wheels, committed on Done. */
const DeliveryTimeBottomSheet = forwardRef<
  DeliveryTimeBottomSheetRef,
  DeliveryTimeBottomSheetProps
>(({ value, onChange }, ref) => {
  const { t } = useTranslation(["common", "orders"]);
  const sheetRef = useRef<BottomSheetMethods>(null);
  const hoursData = useMemo(() => range(0, 23), []);
  const minutesData = useMemo(
    () => range(0, 60 / MINUTE_STEP - 1).map((i) => i * MINUTE_STEP),
    [],
  );
  const [pending, setPending] = useState(() => initialTime(value));

  useImperativeHandle(ref, () => ({
    present: () => {
      setPending(initialTime(value));
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const handleDone = () => {
    const time = dayjs()
      .hour(pending.hours)
      .minute(pending.minutes)
      .startOf("minute");
    if (!time.isAfter(dayjs())) {
      toast.error(t("orders:alerts.deliveryTimeInPast"));
      return;
    }
    onChange(time.toDate());
    sheetRef.current?.dismiss();
  };

  const handleClear = () => {
    onChange(null);
    sheetRef.current?.dismiss();
  };

  return (
    <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
      <BottomSheetView style={tw`px-4 pb-6`}>
        <View style={tw`flex-row items-center justify-between mb-4`}>
          <ThemedText type="h3">{t("orders:form.deliveryTime")}</ThemedText>
          {value && (
            <Button
              label={t("common:actions.clear")}
              leftIcon="x"
              variant="text"
              size="extra-small"
              onPress={handleClear}
            />
          )}
        </View>
        <View style={tw`items-center bg-surface rounded-3xl p-4`}>
          <View style={{ width: COLUMN_WIDTH * 2, height: WHEEL_HEIGHT }}>
            <View
              pointerEvents="none"
              style={[
                tw`absolute left-0 right-0 bg-secondary rounded-3xl`,
                { top: BAND_TOP, height: ITEM_HEIGHT },
              ]}
            />
            <View style={tw`flex-row`}>
              <WheelColumn
                data={hoursData}
                index={Math.max(hoursData.indexOf(pending.hours), 0)}
                onSettle={(index) =>
                  setPending((p) => ({ ...p, hours: hoursData[index] }))
                }
                formatLabel={pad}
                width={COLUMN_WIDTH}
              />
              <WheelColumn
                data={minutesData}
                index={Math.max(minutesData.indexOf(pending.minutes), 0)}
                onSettle={(index) =>
                  setPending((p) => ({ ...p, minutes: minutesData[index] }))
                }
                formatLabel={pad}
                width={COLUMN_WIDTH}
              />
            </View>
          </View>
        </View>
        <View style={tw`mt-6`}>
          <Button label={t("common:actions.done")} onPress={handleDone} />
        </View>
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
});

DeliveryTimeBottomSheet.displayName = "DeliveryTimeBottomSheet";

export default DeliveryTimeBottomSheet;
