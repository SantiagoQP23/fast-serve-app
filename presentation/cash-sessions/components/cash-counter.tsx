import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import {
  CASH_DENOMINATIONS,
  CashCountQuantities,
  formatDenomination,
  getCashCountSubtotal,
  MAX_CASH_QUANTITY,
} from "@/core/cash-sessions/utils/cash-count.util";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Counter from "@/presentation/theme/components/counter";

interface CashCounterProps {
  quantities: CashCountQuantities;
  onChangeQuantity: (value: number, quantity: number) => void;
}

/** Bold "Total" row of a count, docked in the screen's footer. */
export function CashCountTotal({ total }: { total: number }) {
  const { t } = useTranslation(["common"]);

  return (
    <ThemedView style={tw`flex-row items-center justify-between`}>
      <ThemedText type="body1" style={{ fontFamily: typography.bold }}>
        {t("common:cashRegister.count.total")}
      </ThemedText>
      <ThemedText type="h3" style={{ fontFamily: typography.bold }}>
        {formatCurrency(total)}
      </ThemedText>
    </ThemedView>
  );
}

/**
 * One row per bill or coin: the value with its subtotal under it, and a
 * Counter for how many. The total lives outside, in `CashCountTotal`.
 */
export default function CashCounter({
  quantities,
  onChangeQuantity,
}: CashCounterProps) {
  const rows = CASH_DENOMINATIONS.map((value) => {
    const quantity = quantities[value] ?? 0;
    const subtotal = getCashCountSubtotal(value, quantity);
    const label = formatDenomination(value);
    return (
      <ThemedView
        key={value}
        style={tw`flex-row items-center gap-3 py-2 border-b border-divider`}
      >
        <ThemedView style={tw`flex-1`}>
          <ThemedText type="body1" style={{ fontFamily: typography.semibold }}>
            {label}
          </ThemedText>
          <ThemedText
            type="small"
            numberOfLines={1}
            style={tw.style(
              "text-on-surface-variant",
              subtotal === 0 && "text-gray-400",
            )}
          >
            {formatCurrency(subtotal)}
          </ThemedText>
        </ThemedView>
        <Counter
          value={quantity}
          onChangeValue={(next) => onChangeQuantity(value, next)}
          min={0}
          max={MAX_CASH_QUANTITY}
          size="small"
          keyboardType="number-pad"
          accessibilityLabel={label}
          style={tw`w-44`}
        />
      </ThemedView>
    );
  });

  return <ThemedView>{rows}</ThemedView>;
}
