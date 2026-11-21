import { Share } from "react-native";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import IconButton from "@/presentation/theme/components/icon-button";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { typography } from "@/constants/theme";

interface CardCommissionSummaryProps {
  totalCommission: number;
}

/**
 * Card commission the processor keeps in the selected range
 * (plans/comision-tarjeta.md, 11), to register as an expense elsewhere.
 * The copy button opens the share sheet with the plain number ("12.35"),
 * which has Copy: the app has no clipboard module without a native build.
 */
export default function CardCommissionSummary({
  totalCommission,
}: CardCommissionSummaryProps) {
  const { t } = useTranslation(["reports"]);
  const plain = totalCommission.toFixed(2);

  return (
    <ThemedView style={tw`flex-row items-center justify-between gap-2`}>
      <ThemedText type="small">{t("reports:cardCommission.title")}</ThemedText>
      <ThemedView style={tw`flex-row items-center gap-1`}>
        <ThemedText
          selectable
          type="body1"
          style={[tw`text-on-surface`, { fontFamily: typography.semibold }]}
        >
          {formatCurrency(totalCommission)}
        </ThemedText>
        <IconButton
          icon="copy"
          size={16}
          variant="text"
          accessibilityLabel={t("reports:cardCommission.copy")}
          onPress={() => {
            Share.share({ message: plain }).catch(() => {});
          }}
        />
      </ThemedView>
    </ThemedView>
  );
}
