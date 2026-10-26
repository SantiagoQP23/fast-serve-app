import { useState } from "react";
import { Pressable } from "react-native";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import Icon from "@/presentation/theme/components/icon";
import ProgressBar from "@/presentation/theme/components/progress-bar";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { typography } from "@/constants/theme";

interface AmountSummaryHeaderProps {
  totalAmount: number;
  totalIncome: number;
}

export default function AmountSummaryHeader({
  totalAmount,
  totalIncome,
}: AmountSummaryHeaderProps) {
  const { t } = useTranslation(["common"]);
  const [showTotalAmount, setShowTotalAmount] = useState(false);

  const formattedTotalAmount = formatCurrency(totalAmount);
  const displayedTotalAmount = showTotalAmount
    ? formattedTotalAmount
    : formattedTotalAmount.replace(/\d/g, "*");

  return (
    <ThemedView style={tw`gap-4`}>
      {/* Total Amount */}
      <ThemedView style={tw`bg-transparent gap-1`}>
        <ThemedView style={tw`flex-row items-center gap-2`}>
          <ThemedText type="small">{t("common:stats.totalAmount")}</ThemedText>
          <Pressable
            onPress={() => setShowTotalAmount((prev) => !prev)}
            hitSlop={8}
          >
            <Icon
              name={showTotalAmount ? "eye-off" : "eye"}
              size={18}
              color={tw.color("gray-500")}
            />
          </Pressable>
        </ThemedView>
        <ThemedText style={tw`text-5xl`}>{displayedTotalAmount}</ThemedText>
      </ThemedView>

      {/* Income Progress */}
      <ThemedView style={tw`gap-2`}>
        <ThemedView style={tw`flex-row justify-between items-center gap-1`}>
          <ThemedText type="small">{t("common:stats.totalIncome")}</ThemedText>
          <ThemedText
            type="body1"
            style={[tw`text-on-surface`, { fontFamily: typography.semibold }]}
          >
            {formatCurrency(totalIncome)}
          </ThemedText>
        </ThemedView>
        <ProgressBar height={2} progress={totalIncome / (totalAmount || 1)} />
      </ThemedView>
    </ThemedView>
  );
}
