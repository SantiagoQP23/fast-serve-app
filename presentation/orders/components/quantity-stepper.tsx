import { useState } from "react";

import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import IconButton from "@/presentation/theme/components/icon-button";
import TextInput from "@/presentation/theme/components/text-input";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  /** Blocks "+" below `max`, e.g. when no stock is left. */
  incrementDisabled?: boolean;
  /** Set when rendered inside a bottom sheet, so the keyboard lifts it. */
  bottomSheet?: boolean;
  /** `small` fits inside a list row, e.g. a cart item. */
  size?: "medium" | "small";
}

const SIZES = {
  medium: {
    track: "p-1",
    button: "p-3",
    icon: 24,
    input: "w-16 min-h-12",
    inputHeight: "h-12",
    fontSize: 24,
  },
  small: {
    track: "p-0.5",
    button: "p-1.5",
    icon: 18,
    input: "w-10 min-h-8",
    inputHeight: "h-8",
    fontSize: 16,
  },
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * An order line's quantity as one pill: decrease, the quantity (typeable),
 * increase.
 */
export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  incrementDisabled = false,
  bottomSheet = false,
  size = "medium",
}: QuantityStepperProps) {
  const sizes = SIZES[size];
  const { t } = useTranslation(["menu"]);
  // What's typed while editing; null shows the value itself, so empty or
  // out-of-range text snaps back to the quantity kept.
  const [draft, setDraft] = useState<string | null>(null);
  const clearDraft = () => setDraft(null);

  // Typed digits update the quantity right away, so confirming while the
  // keyboard is still open uses what's on screen.
  const onChangeText = (text: string) => {
    const digits = text.replace(/\D/g, "");
    setDraft(digits);
    const parsed = parseInt(digits, 10);
    if (!Number.isNaN(parsed)) onChange(clamp(parsed, min, max));
  };

  const step = (delta: number) => {
    clearDraft();
    onChange(clamp(value + delta, min, max));
  };

  return (
    <ThemedView
      style={tw`self-center flex-row items-center rounded-full bg-surface ${sizes.track}`}
    >
      <IconButton
        icon="minus"
        onPress={() => step(-1)}
        variant="text"
        size={sizes.icon}
        style={tw`rounded-full ${sizes.button}`}
        disabled={value <= min}
        accessibilityLabel={t("menu:product.decrease")}
      />
      <TextInput
        variant="filled"
        inputMode="numeric"
        keyboardType="number-pad"
        returnKeyType="done"
        maxLength={String(max).length}
        selectTextOnFocus
        bottomSheet={bottomSheet}
        value={draft ?? String(value)}
        onChangeText={onChangeText}
        onBlur={clearDraft}
        onSubmitEditing={clearDraft}
        accessibilityLabel={t("menu:product.quantityValue", { count: value })}
        containerStyle={tw`${sizes.input} px-1 bg-transparent`}
        style={[
          tw`${sizes.inputHeight} mt-0 text-center`,
          { fontSize: sizes.fontSize, fontFamily: typography.bold },
        ]}
      />
      <IconButton
        icon="plus"
        onPress={() => step(1)}
        variant="text"
        size={sizes.icon}
        style={tw`rounded-full ${sizes.button}`}
        disabled={value >= max || incrementDisabled}
        accessibilityLabel={t("menu:product.increase")}
      />
    </ThemedView>
  );
}
