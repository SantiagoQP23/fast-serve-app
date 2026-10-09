import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import tw from "../lib/tailwind";
import { BAND_TOP, ITEM_HEIGHT, WHEEL_HEIGHT, WheelColumn, range } from "./wheel-column";

const COLUMN_WIDTH = 108;

/** Lowest/highest minute value that keeps `hours` within [minMinutes, maxMinutes]. */
function minutesRangeForHour(
  hours: number,
  minMinutes: number,
  maxMinutes: number,
) {
  const lo = Math.max(minMinutes - hours * 60, 0);
  const hi = Math.min(maxMinutes - hours * 60, 59);
  return range(lo, hi);
}

export type TimeWheelPickerProps = {
  value: number;
  onChange: (minutes: number) => void;
  minMinutes?: number;
  maxMinutes: number;
  hoursUnit?: string;
  minutesUnit?: string;
  hoursAccessibilityLabel?: string;
  minutesAccessibilityLabel?: string;
};

export default function TimeWheelPicker({
  value,
  onChange,
  minMinutes = 1,
  maxMinutes,
  hoursUnit = "h",
  minutesUnit = "min",
  hoursAccessibilityLabel,
  minutesAccessibilityLabel,
}: TimeWheelPickerProps) {
  const maxHours = Math.floor(maxMinutes / 60);
  const hoursData = useMemo(() => range(0, maxHours), [maxHours]);

  const clampedInitial = Math.min(Math.max(value, minMinutes), maxMinutes);
  const [hours, setHours] = useState(Math.floor(clampedInitial / 60));
  const [minutes, setMinutes] = useState(clampedInitial % 60);

  const minutesData = useMemo(
    () => minutesRangeForHour(hours, minMinutes, maxMinutes),
    [hours, minMinutes, maxMinutes],
  );
  const minutesIndex = Math.max(minutesData.indexOf(minutes), 0);
  const hoursIndex = Math.max(hoursData.indexOf(hours), 0);

  const handleHoursSettle = useCallback(
    (index: number) => {
      const nextHours = hoursData[index];
      const nextMinutesData = minutesRangeForHour(nextHours, minMinutes, maxMinutes);
      const nextMinutes = nextMinutesData.includes(minutes)
        ? minutes
        : Math.min(
            Math.max(minutes, nextMinutesData[0]),
            nextMinutesData[nextMinutesData.length - 1],
          );
      setHours(nextHours);
      setMinutes(nextMinutes);
      onChange(nextHours * 60 + nextMinutes);
    },
    [hoursData, minMinutes, maxMinutes, minutes, onChange],
  );

  const handleMinutesSettle = useCallback(
    (index: number) => {
      const nextMinutes = minutesData[index];
      setMinutes(nextMinutes);
      onChange(hours * 60 + nextMinutes);
    },
    [minutesData, hours, onChange],
  );

  return (
    <View style={tw`items-center bg-light-surface rounded-3xl p-4`}>
      <View style={{ width: COLUMN_WIDTH * 2, height: WHEEL_HEIGHT, position: "relative" }}>
        <View
          pointerEvents="none"
          style={[
            tw`absolute left-0 right-0 bg-light-secondary rounded-3xl`,
            { top: BAND_TOP, height: ITEM_HEIGHT },
          ]}
        />
        <View style={tw`flex-row`}>
          <WheelColumn
            data={hoursData}
            index={hoursIndex}
            onSettle={handleHoursSettle}
            formatLabel={(h) => `${h} ${hoursUnit}`}
            accessibilityLabel={hoursAccessibilityLabel}
            width={COLUMN_WIDTH}
          />
          <WheelColumn
            data={minutesData}
            index={minutesIndex}
            onSettle={handleMinutesSettle}
            formatLabel={(m) => `${String(m).padStart(2, "0")} ${minutesUnit}`}
            accessibilityLabel={minutesAccessibilityLabel}
            width={COLUMN_WIDTH}
          />
        </View>
      </View>
    </View>
  );
}
