import { ActivityIndicator, Pressable, View } from "react-native";
import * as Haptics from "expo-haptics";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "./themed-text";
import tw from "../lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

export interface NumberPadProps {
  /** Typed digits, as a string so leading zeros survive (codes). */
  value: string;
  onChange: (value: string) => void;
  /** Max number of digits; extra presses are ignored. */
  maxLength?: number;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  disabled?: boolean;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Number keys drawn in the app, so they look the same on every phone and
 * don't depend on the system keyboard. 1–9 in three columns, then
 * backspace, 0 and confirm. Flat keys with the 6px corner, confirm in ink.
 */
export default function NumberPad({
  value,
  onChange,
  maxLength,
  onConfirm,
  confirmLabel,
  confirmDisabled = false,
  confirmLoading = false,
  disabled = false,
}: NumberPadProps) {
  const { t } = useTranslation("common");

  const press = (next: string) => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onChange(next);
  };

  const addDigit = (digit: string) => {
    if (maxLength !== undefined && value.length >= maxLength) return;
    press(value + digit);
  };

  const key = (
    content: React.ReactNode,
    onPress: () => void,
    label: string,
  ) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) =>
        tw.style(
          "flex-1 h-14 rounded-md bg-surface-high items-center justify-center",
          pressed && "opacity-80",
        )
      }
    >
      {content}
    </Pressable>
  );

  const digit = (d: string) =>
    key(
      <ThemedText style={{ fontFamily: typography.semibold, fontSize: 24 }}>
        {d}
      </ThemedText>,
      () => addDigit(d),
      d,
    );

  const rows = [KEYS.slice(0, 3), KEYS.slice(3, 6), KEYS.slice(6, 9)];
  const confirmOff = disabled || confirmDisabled || confirmLoading;

  return (
    <View style={tw`gap-2`}>
      {rows.map((row) => (
        <View key={row.join("")} style={tw`flex-row gap-2`}>
          {row.map(digit)}
        </View>
      ))}
      <View style={tw`flex-row gap-2`}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("numberPad.delete")}
          disabled={disabled || value.length === 0}
          onPress={() => press(value.slice(0, -1))}
          onLongPress={() => press("")}
          style={({ pressed }) =>
            tw.style(
              "flex-1 h-14 rounded-md items-center justify-center",
              pressed && "opacity-80",
            )
          }
        >
          <Icon name="delete" size={24} color={tw.color("text")} />
        </Pressable>
        {digit("0")}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={confirmLabel ?? t("numberPad.confirm")}
          disabled={confirmOff}
          onPress={onConfirm}
          style={({ pressed }) =>
            tw.style(
              "flex-1 h-14 rounded-md bg-primary items-center justify-center",
              (pressed || confirmOff) && "opacity-80",
              confirmDisabled && !confirmLoading && "opacity-40",
            )
          }
        >
          {confirmLoading ? (
            <ActivityIndicator color={tw.color("on-primary")} />
          ) : confirmLabel ? (
            <ThemedText
              style={[
                tw`text-on-primary`,
                { fontFamily: typography.semibold, fontSize: 16 },
              ]}
            >
              {confirmLabel}
            </ThemedText>
          ) : (
            <Icon name="check" size={24} color={tw.color("on-primary")} />
          )}
        </Pressable>
      </View>
    </View>
  );
}
