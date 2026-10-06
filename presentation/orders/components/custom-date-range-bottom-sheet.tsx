import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import Button from "@/presentation/theme/components/button";
import DatePicker from "@/presentation/theme/components/date-picker";
import Switch from "@/presentation/theme/components/switch";

interface CustomDateRangeBottomSheetProps {
  onClose: () => void;
  onApply: (range: { startDate: Date; endDate: Date }) => void;
  initialStartDate?: Date;
  initialEndDate?: Date;
}

const hasDistinctEndDate = (start: Date, end: Date) =>
  !dayjs(start).isSame(end, "day");

export default function CustomDateRangeBottomSheet({
  onClose,
  onApply,
  initialStartDate,
  initialEndDate,
}: CustomDateRangeBottomSheetProps) {
  const { t } = useTranslation(["common"]);

  const [startDate, setStartDate] = useState(initialStartDate ?? new Date());
  const [endDate, setEndDate] = useState(initialEndDate ?? new Date());
  const [showEndDate, setShowEndDate] = useState(
    hasDistinctEndDate(
      initialStartDate ?? new Date(),
      initialEndDate ?? new Date(),
    ),
  );

  useEffect(() => {
    const start = initialStartDate ?? new Date();
    const end = initialEndDate ?? new Date();
    setStartDate(start);
    setEndDate(end);
    setShowEndDate(hasDistinctEndDate(start, end));
  }, [initialStartDate, initialEndDate]);

  const handleStartDateChange = (date: Date) => {
    setStartDate(date);
    if (!showEndDate) {
      setEndDate(date);
    }
  };

  const handleToggleEndDate = (value: boolean) => {
    setShowEndDate(value);
    if (!value) {
      setEndDate(startDate);
    }
  };

  const handleApply = () => {
    onApply({ startDate, endDate: showEndDate ? endDate : startDate });
    onClose();
  };

  return (
    <BottomSheetView style={tw`p-4`}>
      <ThemedView style={tw`w-full gap-6`}>
        <ThemedText type="h3" style={tw`text-center`}>
          {t("common:stats.dateRange.custom")}
        </ThemedText>

        <ThemedView style={tw`flex-row gap-3`}>
          <ThemedView style={tw`flex-1`}>
            <DatePicker
              label={t("common:stats.dateRange.startDate")}
              value={startDate}
              onChange={handleStartDateChange}
              maxDate={showEndDate ? endDate : new Date()}
            />
          </ThemedView>

          {showEndDate && (
            <ThemedView style={tw`flex-1`}>
              <DatePicker
                label={t("common:stats.dateRange.endDate")}
                value={endDate}
                onChange={setEndDate}
                minDate={startDate}
                maxDate={new Date()}
              />
            </ThemedView>
          )}
        </ThemedView>
        <Switch
          label={t("common:stats.dateRange.endDate")}
          value={showEndDate}
          onValueChange={handleToggleEndDate}
        />

        <ThemedView style={tw`flex-row gap-3`}>
          <ThemedView style={tw`flex-1`}>
            <Button
              label={t("common:stats.dateRange.apply")}
              onPress={handleApply}
            />
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </BottomSheetView>
  );
}
