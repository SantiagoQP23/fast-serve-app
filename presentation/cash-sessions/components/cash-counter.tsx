import { useState } from "react";
import { TextInput, type TextInputProps } from "react-native";
import {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@expo/ui/community/bottom-sheet";

import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import {
  CASH_DENOMINATIONS,
  CashCountQuantities,
  formatDenomination,
  getCashCountSubtotal,
} from "@/core/cash-sessions/utils/cash-count.util";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";

interface CashCounterProps {
  quantities: CashCountQuantities;
  onChangeQuantity: (value: number, text: string) => void;
  total: number;
  /** Inside a bottom sheet, so inputs stay above the keyboard. */
  bottomSheet?: boolean;
  autoFocus?: boolean;
}

/** Quantity field with only a bottom line, thicker while focused. */
function QuantityInput({
  bottomSheet,
  ...props
}: TextInputProps & { bottomSheet?: boolean }) {
  const [isFocused, setIsFocused] = useState(false);
  const Input = bottomSheet ? BottomSheetTextInput : TextInput;

  return (
    <Input
      {...props}
      onFocus={(e: any) => {
        setIsFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e: any) => {
        setIsFocused(false);
        props.onBlur?.(e);
      }}
      placeholderTextColor={tw.color("on-surface-variant")}
      cursorColor={tw.color("primary")}
      selectionColor={tw.color("primary")}
      style={[
        tw`h-11 text-center text-on-surface`,
        {
          fontSize: 16,
          fontFamily: typography.medium,
          paddingVertical: 0,
          includeFontPadding: false,
          // Same outer height focused or not, so the row doesn't shift.
          borderBottomWidth: isFocused ? 2 : 1,
          paddingTop: isFocused ? 0 : 1,
          borderBottomColor: tw.color(
            isFocused ? "primary" : "on-surface-variant",
          ),
        },
      ]}
    />
  );
}

/** One row per bill or coin: value × quantity = subtotal, total below. */
export default function CashCounter({
  quantities,
  onChangeQuantity,
  total,
  bottomSheet,
  autoFocus,
}: CashCounterProps) {
  const { t } = useTranslation(["common"]);

  const rows = CASH_DENOMINATIONS.map((value, index) => {
    const subtotal = getCashCountSubtotal(value, quantities[value]);
    return (
      <ThemedView key={value} style={tw`flex-row items-center gap-3`}>
        <ThemedText type="body1" style={tw`w-16`}>
          {formatDenomination(value)}
        </ThemedText>
        <ThemedText type="body1" style={tw`text-gray-500`}>
          ×
        </ThemedText>
        <ThemedView style={tw`w-20`}>
          <QuantityInput
            bottomSheet={bottomSheet}
            value={quantities[value] ?? ""}
            onChangeText={(text) => onChangeQuantity(value, text)}
            inputMode="numeric"
            keyboardType="number-pad"
            placeholder="0"
            maxLength={5}
            selectTextOnFocus
            autoFocus={autoFocus && index === 0}
            accessibilityLabel={formatDenomination(value)}
          />
        </ThemedView>
        <ThemedText type="body1" style={tw`text-gray-500`}>
          =
        </ThemedText>
        <ThemedText
          type="body1"
          numberOfLines={1}
          style={tw.style(
            "flex-1 text-right",
            subtotal === 0 && "text-gray-400",
          )}
        >
          {formatCurrency(subtotal)}
        </ThemedText>
      </ThemedView>
    );
  });

  return (
    <ThemedView style={tw`gap-2`}>
      {bottomSheet ? (
        // The sheet sizes to its content: cap the rows so Total and the
        // sheet's button stay on screen.
        <ThemedView style={tw`max-h-[45vh]`}>
          <BottomSheetScrollView
            contentContainerStyle={tw`gap-2`}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {rows}
          </BottomSheetScrollView>
        </ThemedView>
      ) : (
        rows
      )}

      <ThemedView
        style={tw`flex-row items-center justify-between border-t border-divider pt-3 mt-1`}
      >
        <ThemedText type="body1" style={{ fontFamily: typography.bold }}>
          {t("common:cashRegister.count.total")}
        </ThemedText>
        <ThemedText type="h3" style={{ fontFamily: typography.bold }}>
          {formatCurrency(total)}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}
