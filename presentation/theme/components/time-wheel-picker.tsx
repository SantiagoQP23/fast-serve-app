import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import tw from "../lib/tailwind";
import { ThemedText } from "./themed-text";

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const COLUMN_WIDTH = 108;
const BAND_TOP = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2;

function range(start: number, end: number) {
  return Array.from({ length: Math.max(end - start + 1, 0) }, (_, i) => start + i);
}

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

type WheelColumnProps = {
  data: number[];
  index: number;
  onSettle: (index: number) => void;
  formatLabel: (value: number) => string;
  accessibilityLabel?: string;
};

function WheelColumn({
  data,
  index,
  onSettle,
  formatLabel,
  accessibilityLabel,
}: WheelColumnProps) {
  const listRef = useRef<Animated.FlatList<number>>(null);
  const scrollY = useSharedValue(index * ITEM_HEIGHT);
  const lastIndexRef = useRef(index);

  useEffect(() => {
    if (index !== lastIndexRef.current) {
      lastIndexRef.current = index;
      scrollY.value = index * ITEM_HEIGHT;
      listRef.current?.scrollToOffset({
        offset: index * ITEM_HEIGHT,
        animated: true,
      });
    }
    // Only external (controlled) index changes should drive this; the
    // column's own scroll already updates lastIndexRef before onSettle fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const commitOffset = useCallback(
    (offsetY: number) => {
      const nextIndex = Math.min(
        Math.max(Math.round(offsetY / ITEM_HEIGHT), 0),
        data.length - 1,
      );
      if (nextIndex !== lastIndexRef.current) {
        lastIndexRef.current = nextIndex;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSettle(nextIndex);
      }
    },
    [data.length, onSettle],
  );

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      commitOffset(e.nativeEvent.contentOffset.y);
    },
    [commitOffset],
  );

  const handlePressItem = useCallback(
    (i: number) => {
      listRef.current?.scrollToOffset({ offset: i * ITEM_HEIGHT, animated: true });
      commitOffset(i * ITEM_HEIGHT);
    },
    [commitOffset],
  );

  return (
    <Animated.FlatList
      ref={listRef}
      data={data}
      keyExtractor={(item) => String(item)}
      style={{ height: WHEEL_HEIGHT, width: COLUMN_WIDTH }}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      onMomentumScrollEnd={handleMomentumEnd}
      initialScrollIndex={index}
      getItemLayout={(_, i) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * i,
        index: i,
      })}
      contentContainerStyle={{ paddingVertical: BAND_TOP }}
      accessibilityLabel={accessibilityLabel}
      renderItem={({ item, index: i }) => (
        <WheelItem
          index={i}
          scrollY={scrollY}
          label={formatLabel(item)}
          onPress={() => handlePressItem(i)}
        />
      )}
    />
  );
}

type WheelItemProps = {
  index: number;
  scrollY: SharedValue<number>;
  label: string;
  onPress: () => void;
};

function WheelItem({ index, scrollY, label, onPress }: WheelItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const distance = Math.abs(scrollY.value / ITEM_HEIGHT - index);
    return {
      opacity: interpolate(distance, [0, 1, 2], [1, 0.45, 0.2], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(distance, [0, 1, 2], [1, 0.88, 0.78], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Pressable
      onPress={onPress}
      style={{ height: ITEM_HEIGHT, alignItems: "center", justifyContent: "center" }}
    >
      <Animated.View style={animatedStyle}>
        <ThemedText type="h4">{label}</ThemedText>
      </Animated.View>
    </Pressable>
  );
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
          />
          <WheelColumn
            data={minutesData}
            index={minutesIndex}
            onSettle={handleMinutesSettle}
            formatLabel={(m) => `${String(m).padStart(2, "0")} ${minutesUnit}`}
            accessibilityLabel={minutesAccessibilityLabel}
          />
        </View>
      </View>
    </View>
  );
}
