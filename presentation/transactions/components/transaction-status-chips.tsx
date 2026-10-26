import { ScrollView as GestureScrollView } from "react-native-gesture-handler";
import tw from "@/presentation/theme/lib/tailwind";
import Chip from "@/presentation/theme/components/chip";
import Label, { type LabelProps } from "@/presentation/theme/components/label";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { TransactionStatus } from "@/core/transactions/models/transaction-status.enum";

interface TransactionStatusChipsProps {
  counts: Partial<Record<TransactionStatus, number>>;
  selectedStatus: TransactionStatus | null;
  onSelectStatus: (status: TransactionStatus | null) => void;
}

const STATUS_CHIPS: {
  key: TransactionStatus;
  labelKey: string;
  color: NonNullable<LabelProps["color"]>;
}[] = [
  {
    key: TransactionStatus.PENDING_APPROVAL,
    labelKey: "common:transactions.status.pendingApproval",
    color: "warning",
  },
  {
    key: TransactionStatus.PENDING_PROOF,
    labelKey: "common:transactions.status.pendingProof",
    color: "warning",
  },
  {
    key: TransactionStatus.COMPLETED,
    labelKey: "common:transactions.status.completed",
    color: "success",
  },
  {
    key: TransactionStatus.REJECTED,
    labelKey: "common:transactions.status.rejected",
    color: "error",
  },
  {
    key: TransactionStatus.CANCELLED,
    labelKey: "common:transactions.status.cancelled",
    color: "default",
  },
];

/**
 * Transaction status filter chips with their counts, like the inventory stock
 * chips: tap to filter, tap again to clear. Empty statuses are hidden.
 */
export default function TransactionStatusChips({
  counts,
  selectedStatus,
  onSelectStatus,
}: TransactionStatusChipsProps) {
  const { t } = useTranslation("common");

  const chips = STATUS_CHIPS.filter(
    (chip) => (counts[chip.key] ?? 0) > 0 || selectedStatus === chip.key,
  );

  if (chips.length === 0) return null;

  return (
    <GestureScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={tw`flex-grow-0`}
      contentContainerStyle={tw`gap-2`}
    >
      {chips.map((chip) => {
        const isSelected = selectedStatus === chip.key;
        const count = counts[chip.key] ?? 0;
        return (
          <Chip
            key={chip.key}
            label={t(chip.labelKey)}
            selected={isSelected}
            onPress={() => onSelectStatus(isSelected ? null : chip.key)}
            rightContent={
              <Label
                text={String(count)}
                size="small"
                color={count === 0 ? "default" : chip.color}
              />
            }
          />
        );
      })}
    </GestureScrollView>
  );
}
