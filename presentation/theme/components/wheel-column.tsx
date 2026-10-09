import { useCallback, useEffect, useRef } from "react";
import { NativeSyntheticEvent, NativeScrollEvent, Pressable } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ThemedText } from "./themed-text";

export const ITEM_HEIGHT = 48;
export const VISIBLE_ITEMS = 5;
export const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
export const BAND_TOP = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2;

export function range(start: number, end: number) {
  return Array.from({ length: Math.max(end - start + 1, 0) }, (_, i) => start + i);
}

export type WheelColumnProps = {
  data: number[];
  index: number;
  onSettle: (index: number) => void;
  formatLabel: (value: number) => string;
  accessibilityLabel?: string;
  width?: number;
};

export function WheelColumn({
  data,
  index,
  onSettle,
  formatLabel,
  accessibilityLabel,
  width = 108,
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
      style={{ height: WHEEL_HEIGHT, width }}
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
