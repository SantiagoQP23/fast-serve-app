import { useCallback, useMemo } from "react";
import { View } from "react-native";
import tw from "../lib/tailwind";
import { BAND_TOP, ITEM_HEIGHT, WHEEL_HEIGHT, WheelColumn, range } from "./wheel-column";

const COLUMN_WIDTH = 160;

const defaultFormatLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

export type HourWheelPickerProps = {
  value: number;
  onChange: (hour: number) => void;
  formatLabel?: (hour: number) => string;
  accessibilityLabel?: string;
};

export default function HourWheelPicker({
  value,
  onChange,
  formatLabel = defaultFormatLabel,
  accessibilityLabel,
}: HourWheelPickerProps) {
  const hoursData = useMemo(() => range(0, 23), []);
  const clampedValue = Math.min(Math.max(value, 0), 23);
  const index = Math.max(hoursData.indexOf(clampedValue), 0);

  const handleSettle = useCallback(
    (nextIndex: number) => {
      onChange(hoursData[nextIndex]);
    },
    [hoursData, onChange],
  );

  return (
    <View style={tw`items-center bg-light-surface rounded-3xl p-4`}>
      <View style={{ width: COLUMN_WIDTH, height: WHEEL_HEIGHT, position: "relative" }}>
        <View
          pointerEvents="none"
          style={[
            tw`absolute left-0 right-0 bg-light-secondary rounded-3xl`,
            { top: BAND_TOP, height: ITEM_HEIGHT },
          ]}
        />
        <WheelColumn
          data={hoursData}
          index={index}
          onSettle={handleSettle}
          formatLabel={formatLabel}
          accessibilityLabel={accessibilityLabel}
          width={COLUMN_WIDTH}
        />
      </View>
    </View>
  );
}
