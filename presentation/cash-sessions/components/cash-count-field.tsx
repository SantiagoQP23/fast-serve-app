import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import TextInput from "@/presentation/theme/components/text-input";
import ButtonGroup from "@/presentation/theme/components/button-group";
import { CashCountMode, CashCountState } from "../hooks/useCashCount";
import CashCounter from "./cash-counter";

interface CashCountFieldProps {
  count: CashCountState;
  /** Label of the single total field. */
  amountLabel: string;
  bottomSheet?: boolean;
  autoFocus?: boolean;
}

/** Cash in the register: counted bill by bill, or typed as one total. */
export default function CashCountField({
  count,
  amountLabel,
  bottomSheet,
  autoFocus,
}: CashCountFieldProps) {
  const { t } = useTranslation(["common"]);

  return (
    <ThemedView style={tw`gap-4`}>
      <ButtonGroup
        options={[
          { value: "count", label: t("common:cashRegister.count.modeCount") },
          { value: "amount", label: t("common:cashRegister.count.modeAmount") },
        ]}
        selected={count.mode}
        onChange={(mode: CashCountMode) => count.setMode(mode)}
      />

      {count.mode === "count" ? (
        <CashCounter
          quantities={count.quantities}
          onChangeQuantity={count.setQuantity}
          total={count.total}
          bottomSheet={bottomSheet}
          autoFocus={autoFocus}
        />
      ) : (
        <TextInput
          bottomSheet={bottomSheet}
          variant="outlined"
          label={amountLabel}
          value={count.amount}
          onChangeText={count.setAmount}
          inputMode="decimal"
          placeholder="0.00"
          icon="banknote"
          autoFocus={autoFocus}
        />
      )}
    </ThemedView>
  );
}
