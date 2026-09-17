import { useState, useEffect } from "react";
import { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import Button from "@/presentation/theme/components/button";
import DatePicker from "@/presentation/theme/components/date-picker";

interface CustomDateRangeBottomSheetProps {
  onClose: () => void;
  onApply: (range: { startDate: Date; endDate: Date }) => void;
  initialStartDate?: Date;
  initialEndDate?: Date;
}

export default function CustomDateRangeBottomSheet({
  onClose,
  onApply,
  initialStartDate,
  initialEndDate,
}: CustomDateRangeBottomSheetProps) {
  const { t } = useTranslation(["common"]);

  const [startDate, setStartDate] = useState(initialStartDate ?? new Date());
  const [endDate, setEndDate] = useState(initialEndDate ?? new Date());

  useEffect(() => {
    setStartDate(initialStartDate ?? new Date());
    setEndDate(initialEndDate ?? new Date());
  }, [initialStartDate, initialEndDate]);

  const handleApply = () => {
    onApply({ startDate, endDate });
    onClose();
  };

  return (
    <BottomSheetView style={tw`p-4`}>
      <ThemedView style={tw`w-full gap-6`}>
        <ThemedText type="h3" style={tw`text-center`}>
          {t("common:stats.dateRange.custom")}
        </ThemedText>

        <DatePicker
          label={t("common:stats.dateRange.startDate")}
          value={startDate}
          onChange={setStartDate}
          maxDate={endDate}
        />

        <DatePicker
          label={t("common:stats.dateRange.endDate")}
          value={endDate}
          onChange={setEndDate}
          minDate={startDate}
          maxDate={new Date()}
        />

        <ThemedView style={tw`flex-row gap-3`}>
          <ThemedView style={tw`flex-1`}>
            <Button label={t("common:stats.dateRange.apply")} onPress={handleApply} />
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </BottomSheetView>
  );
}
