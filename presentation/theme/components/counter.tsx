import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  TextInput as RNTextInput,
  Pressable,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "../lib/tailwind";
import { ThemedText } from "./themed-text";
import { typography } from "@/constants/theme";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "./bottom-sheet-picker";
import IconButton from "./icon-button";

type CounterSize = "small" | "medium" | "large";

const SIZES: Record<
  CounterSize,
  { button: string; icon: number; fontSize: number }
> = {
  small: { button: "w-10 h-10", icon: 16, fontSize: 18 },
  medium: { button: "w-12 h-12", icon: 20, fontSize: 24 },
  large: { button: "w-14 h-14", icon: 50, fontSize: 34 },
};

function getDecimals(step: number) {
  const dot = step.toString().indexOf(".");
  return dot === -1 ? 0 : step.toString().length - dot - 1;
}

function clamp(value: number, min?: number, max?: number) {
  let result = value;
  if (min !== undefined) result = Math.max(result, min);
  if (max !== undefined) result = Math.min(result, max);
  return result;
}

export interface CounterProps {
  value: number;
  onChangeValue: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  units?: string[];
  onChangeUnit?: (unit: string) => void;
  disabled?: boolean;
  size?: CounterSize;
  style?: StyleProp<ViewStyle>;
}

export default function Counter({
  value,
  onChangeValue,
  step = 1,
  min = 0,
  max,
  unit,
  units,
  onChangeUnit,
  disabled = false,
  size = "large",
  style,
}: CounterProps) {
  const { button, icon: iconSize, fontSize } = SIZES[size];
  const decimals = getDecimals(step);
  const isFocused = useRef(false);
  const unitPickerRef = useRef<BottomSheetPickerRef>(null);
  const [text, setText] = useState(String(value));

  useEffect(() => {
    if (!isFocused.current) setText(String(value));
  }, [value]);

  const commit = useCallback(
    (next: number) => {
      const clamped = clamp(Number(next.toFixed(decimals)), min, max);
      onChangeValue(clamped);
      setText(String(clamped));
    },
    [onChangeValue, decimals, min, max],
  );

  const handleDecrement = () => {
    if (disabled) return;
    commit((Number.isFinite(value) ? value : 0) - step);
  };

  const handleIncrement = () => {
    if (disabled) return;
    commit((Number.isFinite(value) ? value : 0) + step);
  };

  const handleChangeText = (next: string) => {
    setText(next);
    const parsed = Number(next.replace(",", "."));
    if (next.trim() !== "" && Number.isFinite(parsed)) {
      onChangeValue(clamp(parsed, min, max));
    }
  };

  const handleBlur = () => {
    isFocused.current = false;
    const parsed = Number(text.replace(",", "."));
    commit(Number.isFinite(parsed) ? parsed : 0);
  };

  const canDecrement = !disabled && (min === undefined || value > min);
  const canIncrement = !disabled && (max === undefined || value < max);
  const canChangeUnit = !disabled && !!units?.length && !!onChangeUnit;

  return (
    <View style={[tw`flex-row items-center gap-3`, style]}>
      <IconButton
        icon="remove"
        variant="outlined"
        size={iconSize}
        disabled={!canDecrement}
        onPress={handleDecrement}
        style={tw.style(
          ` items-center justify-center bg-light-surface-high border-0`,
        )}
      />

      <View
        style={tw.style(
          "flex-1 flex-row items-center justify-center rounded-3xl bg-light-surface-container-low px-4 py-2",
          disabled && "opacity-50",
        )}
      >
        <RNTextInput
          value={text}
          onFocus={() => {
            isFocused.current = true;
          }}
          onChangeText={handleChangeText}
          onBlur={handleBlur}
          editable={!disabled}
          keyboardType="decimal-pad"
          selectTextOnFocus
          style={[
            tw`text-center text-light-text`,
            { fontSize, fontFamily: typography.bold, minWidth: 32, padding: 0 },
          ]}
        />

        {unit &&
          (canChangeUnit ? (
            <Pressable
              onPress={() => unitPickerRef.current?.present()}
              hitSlop={8}
              style={tw`ml-1.5 flex-row items-center`}
            >
              <ThemedText
                type="body2"
                style={[
                  tw`text-light-on-surface-variant`,
                  { fontFamily: typography.medium },
                ]}
              >
                {unit}
              </ThemedText>
              <Ionicons
                name="chevron-down"
                size={12}
                color={tw.color("light-on-surface-variant")}
                style={tw`ml-0.5`}
              />
            </Pressable>
          ) : (
            <ThemedText
              type="body2"
              style={[
                tw`ml-1.5 text-light-on-surface-variant`,
                { fontFamily: typography.medium },
              ]}
            >
              {unit}
            </ThemedText>
          ))}
      </View>

      <IconButton
        icon="add"
        variant="secondary"
        size={iconSize}
        disabled={!canIncrement}
        onPress={handleIncrement}
        style={tw.style(` items-center justify-center`)}
      />

      {canChangeUnit && (
        <BottomSheetPicker
          ref={unitPickerRef}
          title="Unit"
          options={units!.map((u) => ({ label: u, value: u }))}
          value={unit}
          onChange={(v) => onChangeUnit?.(String(v))}
          searchable={false}
        />
      )}
    </View>
  );
}
