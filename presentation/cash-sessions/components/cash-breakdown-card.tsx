import { formatCurrency } from "@/core/i18n/utils";
import { CashCountLine } from "@/core/cash-sessions/models/cash-session.model";
import { formatDenomination } from "@/core/cash-sessions/utils/cash-count.util";
import tw from "@/presentation/theme/lib/tailwind";
import {
  DetailCard,
  DetailCardRow,
  DetailCardTitle,
} from "@/presentation/theme/components/detail-card";

interface CashBreakdownCardProps {
  title: string;
  lines: CashCountLine[] | null;
}

/** The bills and coins of one count; nothing when only a total was typed. */
export default function CashBreakdownCard({
  title,
  lines,
}: CashBreakdownCardProps) {
  if (!lines?.length) return null;

  return (
    <DetailCard style={tw`py-2`}>
      <DetailCardTitle title={title} />
      {[...lines]
        .sort((a, b) => b.value - a.value)
        .map((line) => (
          <DetailCardRow
            key={line.value}
            label={`${formatDenomination(line.value)} × ${line.quantity}`}
            value={formatCurrency(line.value * line.quantity)}
          />
        ))}
    </DetailCard>
  );
}
