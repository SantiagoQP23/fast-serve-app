import Card from "@/presentation/theme/components/card";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import ProgressBar from "@/presentation/theme/components/progress-bar";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { useSalesByProductionArea } from "@/presentation/orders/hooks/useSalesByProductionArea";
import { DateRange } from "@/core/orders/enums/date-range-filter.enum";

export default function SalesByProductionAreaCard({
  dateRange,
  userId,
}: {
  dateRange: DateRange;
  userId?: string;
}) {
  const { t } = useTranslation(["reports", "common"]);
  const { areas, totalAmountSold, isLoading } = useSalesByProductionArea(
    dateRange,
    userId,
  );

  return (
    <Card>
      <ThemedText type="h4" style={tw`mb-3`}>
        {t("reports:salesByProductionArea.title")}
      </ThemedText>

      {isLoading ? (
        <ThemedText type="body2" style={tw`text-gray-400 text-center py-4`}>
          {t("common:status.loading")}
        </ThemedText>
      ) : areas.length > 0 ? (
        <ThemedView style={tw`gap-4`}>
          {areas.map((area) => {
            const share = totalAmountSold
              ? area.totalAmountSold / totalAmountSold
              : 0;

            return (
              <ThemedView
                key={area.productionAreaId ?? "none"}
                style={tw`gap-2`}
              >
                <ThemedView style={tw`flex-row justify-between items-center`}>
                  <ThemedView style={tw`gap-0.5 flex-1`}>
                    <ThemedText
                      type="body2"
                      numberOfLines={1}
                      style={{ fontFamily: typography.medium }}
                    >
                      {area.productionAreaName ??
                        t("reports:salesByProductionArea.noArea")}
                    </ThemedText>
                    <ThemedText type="small" style={tw`text-gray-500`}>
                      {t("reports:bestSelling.unitsSold", {
                        count: Number(area.totalSold),
                      })}
                      {" · "}
                      {`${Math.round(share * 100)}%`}
                    </ThemedText>
                  </ThemedView>
                  <ThemedText type="body2" style={tw`text-gray-600`}>
                    {formatCurrency(Number(area.totalAmountSold))}
                  </ThemedText>
                </ThemedView>
                <ProgressBar height={2} progress={share} />
              </ThemedView>
            );
          })}
        </ThemedView>
      ) : (
        <ThemedText type="body2" style={tw`text-gray-400 text-center py-4`}>
          {t("reports:bestSelling.noData")}
        </ThemedText>
      )}
    </Card>
  );
}
