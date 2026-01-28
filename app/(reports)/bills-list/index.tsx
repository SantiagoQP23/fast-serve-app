import React, { useState, useCallback } from "react";
import { ScrollView, RefreshControl, Alert, Pressable } from "react-native";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useBillsList } from "@/presentation/orders/hooks/useBillsList";
import { useRouter } from "expo-router";
import DashboardBillCard from "@/presentation/home/components/dashboard-bill-card";
import * as Haptics from "expo-haptics";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import BillsFilterModal from "@/presentation/orders/components/bills-filter-modal";
import { BillListFiltersDto } from "@/core/orders/dto/bill-list-filters.dto";
import { formatCurrency } from "@/core/i18n/utils";

export default function BillsListScreen() {
  const { t } = useTranslation(["bills", "common", "errors"]);
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const primaryColor = useThemeColor({}, "primary");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<BillListFiltersDto>({});

  const { bills, count, isLoading, refetch } = useBillsList(filters);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await refetch();
    } catch {
      Alert.alert(
        t("errors:order.fetchError"),
        t("errors:order.ordersFetchFailed")
      );
    } finally {
      setRefreshing(false);
    }
  }, [refetch, t]);

  const handleBillPress = (billItem: any) => {
    // Navigate to view-only screen using order ID
    router.push(`/(order-view)/${billItem.order.id}`);
  };

  const handleApplyFilters = (newFilters: BillListFiltersDto) => {
    setFilters(newFilters);
  };

  const hasActiveFilters =
    filters.paymentMethod !== undefined || filters.isPaid !== undefined;

  // Calculate totals
  const totalAmount = bills.reduce((sum, bill) => sum + bill.total, 0);
  const paidCount = bills.filter((b) => b.isPaid).length;
  const unpaidCount = bills.filter((b) => !b.isPaid).length;

  return (
    <ThemedView style={tw`flex-1 pt-6`}>
      {/* Header */}
      <ThemedView style={tw`px-4 mb-4 gap-3`}>
        <ThemedView style={tw`flex-row items-center justify-between`}>
          <ThemedText type="h2">{t("bills:list.allBills")}</ThemedText>
          <Pressable
            onPress={() => setFilterModalVisible(true)}
            style={tw`p-2 rounded-lg ${
              hasActiveFilters ? "bg-primary-50" : "bg-gray-100"
            }`}
          >
            <Ionicons
              name="filter"
              size={20}
              color={
                hasActiveFilters
                  ? tw.color("primary-600")
                  : tw.color("gray-600")
              }
            />
          </Pressable>
        </ThemedView>

        {/* Summary stats */}
        {bills.length > 0 && (
          <ThemedView style={tw`flex-row gap-3`}>
            <ThemedView
              style={tw`flex-1 bg-gray-50 p-3 rounded-xl border border-gray-200`}
            >
              <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
                {t("common:labels.total")}
              </ThemedText>
              <ThemedText type="h4" style={tw`text-primary-700`}>
                {formatCurrency(totalAmount)}
              </ThemedText>
            </ThemedView>
            <ThemedView
              style={tw`flex-1 bg-gray-50 p-3 rounded-xl border border-gray-200`}
            >
              <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
                {t("bills:details.paid")} / {t("bills:details.unpaid")}
              </ThemedText>
              <ThemedText type="h4">
                <ThemedText style={tw`text-green-700`}>{paidCount}</ThemedText>
                <ThemedText style={tw`text-gray-400`}> / </ThemedText>
                <ThemedText style={tw`text-orange-700`}>
                  {unpaidCount}
                </ThemedText>
              </ThemedText>
            </ThemedView>
          </ThemedView>
        )}

        {/* Active filters indicator */}
        {hasActiveFilters && (
          <ThemedView style={tw`flex-row items-center gap-2`}>
            <Ionicons
              name="filter"
              size={14}
              color={tw.color("primary-600")}
            />
            <ThemedText type="small" style={tw`text-primary-700`}>
              {t("bills:list.showingBills", { count: bills.length })}
            </ThemedText>
            <Pressable onPress={() => setFilters({})}>
              <ThemedText type="small" style={tw`text-primary-600 underline`}>
                {t("bills:filters.reset")}
              </ThemedText>
            </Pressable>
          </ThemedView>
        )}
      </ThemedView>

      {/* Bills list */}
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pb-20`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
      >
        {isLoading && !refreshing ? (
          <ThemedView style={tw`py-20 items-center`}>
            <ThemedText type="body2" style={tw`text-gray-400`}>
              {t("common:status.loading")}
            </ThemedText>
          </ThemedView>
        ) : bills.length > 0 ? (
          <ThemedView style={tw`px-4 bg-white rounded-2xl mx-4 py-2 shadow-sm border border-gray-200`}>
            {bills.map((bill, index) => (
              <DashboardBillCard
                key={bill.id}
                bill={bill}
                onPress={() => handleBillPress(bill)}
              />
            ))}
          </ThemedView>
        ) : (
          <ThemedView style={tw`py-20 items-center px-4`}>
            <Ionicons
              name="receipt-outline"
              size={64}
              color={tw.color("gray-300")}
            />
            <ThemedText type="h4" style={tw`text-gray-500 mt-4 text-center`}>
              {t("bills:list.noBillsToday")}
            </ThemedText>
            <ThemedText
              type="body2"
              style={tw`text-gray-400 mt-2 text-center max-w-xs`}
            >
              {t("bills:list.noBillsTodayDescription")}
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <BillsFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
      />
    </ThemedView>
  );
}
