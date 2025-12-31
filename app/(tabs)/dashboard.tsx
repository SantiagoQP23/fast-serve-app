import React from "react";
import { ScrollView } from "react-native";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import DailyReportSummaryCard from "@/presentation/home/components/daily-report-summary-card";

export default function DashboardScreen() {
  const { t } = useTranslation("common");

  return (
    <ThemedView style={tw`flex-1 pt-8`}>
      <ThemedView style={tw`px-4 mb-4`}>
        <ThemedText type="h2">{t("navigation.dashboard")}</ThemedText>
      </ThemedView>

      <ScrollView
        contentContainerStyle={tw`pb-20`}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={tw`px-4`}>
          <DailyReportSummaryCard />
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}
