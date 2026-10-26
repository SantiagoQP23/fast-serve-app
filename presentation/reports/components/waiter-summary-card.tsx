import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import Card from "@/presentation/theme/components/card";
import ProgressBar from "@/presentation/theme/components/progress-bar";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { typography } from "@/constants/theme";
import { WaiterStatsDto } from "@/core/orders/dto/daily-report-response.dto";

interface WaiterSummaryCardProps {
  waiters: WaiterStatsDto[];
}

export default function WaiterSummaryCard({ waiters }: WaiterSummaryCardProps) {
  const { t } = useTranslation(["reports"]);

  if (waiters.length === 0) return null;

  return (
    <Card>
      <ThemedText type="h4" style={tw`mb-3`}>
        {t("reports:waiterStats.title")}
      </ThemedText>
      <ThemedView style={tw`gap-4`}>
        {waiters.map((waiter) => (
          <ThemedView key={waiter.userId} style={tw`gap-2`}>
            <ThemedView style={tw`flex-row justify-between items-center`}>
              <ThemedView style={tw`gap-1`}>
                <ThemedText
                  type="body2"
                  style={{ fontFamily: typography.medium }}
                >
                  {waiter.fullName}
                </ThemedText>
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {waiter.totalOrders} {t("reports:waiterStats.orders")}
                  {" · "}
                  {formatCurrency(waiter.totalIncome)}
                  {" · "}
                  {t("reports:waiterStats.average")}{" "}
                  {formatCurrency(waiter.averageOrderAmount ?? 0)}
                </ThemedText>
              </ThemedView>

              <ThemedView style={tw`flex-row gap-1 items-center justify-end`}>
                <ThemedText type="body2">
                  {formatCurrency(waiter.totalAmount)}
                </ThemedText>
              </ThemedView>
            </ThemedView>
            <ProgressBar
              height={2}
              progress={(waiter.totalIncome || 0) / (waiter.totalAmount || 1)}
            />
          </ThemedView>
        ))}
      </ThemedView>
    </Card>
  );
}
