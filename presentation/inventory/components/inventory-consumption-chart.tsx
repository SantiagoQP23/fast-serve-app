import { View } from "react-native";
import dayjs from "dayjs";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import type { DailyConsumption } from "@/core/inventory/models/inventory-movement.model";

interface InventoryConsumptionChartProps {
  data: DailyConsumption[];
  unit: string;
}

export default function InventoryConsumptionChart({
  data,
  unit,
}: InventoryConsumptionChartProps) {
  const { t } = useTranslation("inventory");
  const total = data.reduce((sum, day) => sum + day.total, 0);
  const max = Math.max(...data.map((day) => day.total), 1);
  const peakIndex = data.reduce(
    (peak, day, index) => (day.total > data[peak].total ? index : peak),
    0,
  );

  return (
    <ThemedView style={tw`bg-light-surface rounded-3xl p-6 gap-4 shadow-xs`}>
      <ThemedView
        style={tw`flex-row items-center justify-between bg-transparent`}
      >
        <ThemedText type="body1" style={{ fontFamily: typography.bold }}>
          {t("detail.weeklyConsumption")}
        </ThemedText>
        <ThemedText type="small" style={tw`text-gray-500`}>
          {t("detail.totalLabel", { total: `${total} ${unit}` })}
        </ThemedText>
      </ThemedView>

      <ThemedView style={tw`flex-row items-end gap-2 h-32 bg-transparent`}>
        {data.map((day, index) => {
          const isPeak = day.total > 0 && index === peakIndex;
          const heightPercent =
            day.total > 0 ? Math.max((day.total / max) * 100, 8) : 2;

          return (
            <ThemedView
              key={day.date}
              style={tw`flex-1 items-center justify-end h-full gap-1.5 bg-transparent`}
            >
              <ThemedText
                type="small"
                style={[
                  isPeak ? tw`text-light-primary` : tw`text-gray-500`,
                  isPeak && { fontFamily: typography.bold },
                ]}
              >
                {day.total > 0 ? day.total : ""}
              </ThemedText>
              <View
                style={[
                  tw.style(
                    "w-full rounded-t-lg",
                    isPeak ? "bg-light-primary" : "bg-light-secondary",
                  ),
                  { height: `${heightPercent}%` },
                ]}
              />
              <ThemedText
                type="small"
                style={
                  isPeak
                    ? [tw`text-light-primary`, { fontFamily: typography.bold }]
                    : tw`text-gray-500`
                }
              >
                {dayjs(day.date).format("ddd")}
              </ThemedText>
            </ThemedView>
          );
        })}
      </ThemedView>
    </ThemedView>
  );
}
