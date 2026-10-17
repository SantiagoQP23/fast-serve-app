import { useMemo } from "react";
import { PieChart } from "react-native-chart-kit";
import Card from "@/presentation/theme/components/card";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import tw from "@/presentation/theme/lib/tailwind";
import { typography, isDarkTheme } from "@/constants/theme";
import { useThemeStore } from "@/presentation/theme/store/useThemeStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { useSalesByProductionArea } from "@/presentation/orders/hooks/useSalesByProductionArea";
import { DateRange } from "@/core/orders/enums/date-range-filter.enum";

// Gray ramp from the biggest slice to the smallest, spread evenly over the
// slices that exist so few slices still get strong contrast. Light themes go
// dark -> light, the dark theme goes light -> dark.
const GRAY_RAMP_LIGHT = { from: 38, to: 212 };
const GRAY_RAMP_DARK = { from: 242, to: 82 };

const grayShade = (index: number, count: number, dark: boolean) => {
  const { from, to } = dark ? GRAY_RAMP_DARK : GRAY_RAMP_LIGHT;
  const t = count > 1 ? index / (count - 1) : 0;
  const channel = Math.round(from + (to - from) * t)
    .toString(16)
    .padStart(2, "0");
  return `#${channel}${channel}${channel}`;
};

// With 9+ areas, the smallest ones fold into a single "Other" slice.
const MAX_SLICES = 8;
const CHART_SIZE = 200;

type Slice = {
  key: string;
  name: string;
  amount: number;
  units: number;
  color: string;
};

export default function SalesByProductionAreaCard({
  dateRange,
  userId,
}: {
  dateRange: DateRange;
  userId?: string;
}) {
  const { t } = useTranslation(["reports", "common"]);
  const theme = useThemeStore((state) => state.theme);
  const { areas, totalAmountSold, isLoading } = useSalesByProductionArea(
    dateRange,
    userId,
  );

  const slices = useMemo<Slice[]>(() => {
    const toSlice = (area: (typeof areas)[number]): Omit<Slice, "color"> => ({
      key: String(area.productionAreaId ?? "none"),
      name:
        area.productionAreaName ?? t("reports:salesByProductionArea.noArea"),
      amount: Number(area.totalAmountSold),
      units: Number(area.totalSold),
    });

    let base: Omit<Slice, "color">[];
    if (areas.length <= MAX_SLICES) {
      base = areas.map(toSlice);
    } else {
      const rest = areas.slice(MAX_SLICES - 1);
      base = [
        ...areas.slice(0, MAX_SLICES - 1).map(toSlice),
        {
          key: "other",
          name: t("reports:salesByProductionArea.other"),
          amount: rest.reduce((sum, a) => sum + Number(a.totalAmountSold), 0),
          units: rest.reduce((sum, a) => sum + Number(a.totalSold), 0),
        },
      ];
    }

    const dark = isDarkTheme(theme);
    return base.map((slice, index) => ({
      ...slice,
      color: grayShade(index, base.length, dark),
    }));
  }, [areas, theme, t]);

  const pieData = useMemo(
    () =>
      slices
        .filter((slice) => slice.amount > 0)
        .map((slice) => ({
          name: slice.name,
          amount: slice.amount,
          color: slice.color,
        })),
    [slices],
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
      ) : slices.length > 0 ? (
        <ThemedView style={tw`gap-4`}>
          {pieData.length > 0 && (
            <ThemedView style={tw`items-center`}>
              <PieChart
                data={pieData}
                accessor="amount"
                width={CHART_SIZE}
                height={CHART_SIZE}
                // chart-kit draws the pie at width / 4 (leaving room for its
                // legend); shifting by another quarter centers it.
                paddingLeft={String(CHART_SIZE / 4)}
                backgroundColor="transparent"
                hasLegend={false}
                // Required by chart-kit even though slices bring their own color.
                chartConfig={{ color: () => "#000" }}
              />
            </ThemedView>
          )}

          {/* Legend */}
          {slices.map((slice) => {
            const share = totalAmountSold ? slice.amount / totalAmountSold : 0;

            return (
              <ThemedView key={slice.key} style={tw`flex-row items-center`}>
                <ThemedView
                  style={[
                    tw`w-3 h-3 rounded-full mr-3`,
                    { backgroundColor: slice.color },
                  ]}
                />
                <ThemedView style={tw`gap-0.5 flex-1`}>
                  <ThemedText
                    type="body2"
                    numberOfLines={1}
                    style={{ fontFamily: typography.medium }}
                  >
                    {slice.name}
                  </ThemedText>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {t("reports:bestSelling.unitsSold", {
                      count: slice.units,
                    })}
                    {" · "}
                    {`${Math.round(share * 100)}%`}
                  </ThemedText>
                </ThemedView>
                <ThemedText type="body2" style={tw`text-gray-600`}>
                  {formatCurrency(slice.amount)}
                </ThemedText>
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
