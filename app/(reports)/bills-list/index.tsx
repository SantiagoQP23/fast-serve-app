import React, { useState, useCallback, useMemo, useRef } from "react";
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
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import BillsFilterBottomSheet from "@/presentation/orders/components/bills-filter-bottom-sheet";
import { BillListFiltersDto } from "@/core/orders/dto/bill-list-filters.dto";
import { formatCurrency } from "@/core/i18n/utils";
import { translatePaymentMethod, getPaymentMethodIcon } from "@/core/i18n/utils";
import { PaymentMethod } from "@/core/orders/enums/payment-method";

export default function BillsListScreen() {
  const { t } = useTranslation(["bills", "common", "errors"]);
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const primaryColor = useThemeColor({}, "primary");
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [filters, setFilters] = useState<BillListFiltersDto>({});

  // Animation config for smooth, iOS-like bottom sheet animations
  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 50,
    stiffness: 300,
    mass: 1,
    overshootClamping: true,
  });

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

  const handleOpenFilters = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleCloseFilters = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const handleApplyFilters = useCallback((newFilters: BillListFiltersDto) => {
    setFilters(newFilters);
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters =
    filters.paymentMethod !== undefined ||
    filters.isPaid !== undefined ||
    filters.ownerId !== undefined;

  // Compute available waiters from bills
  const availableWaiters = useMemo(() => {
    const waiterMap = new Map<string, string>();
    bills.forEach((bill) => {
      if (!waiterMap.has(bill.owner.id)) {
        waiterMap.set(bill.owner.id, bill.owner.fullName);
      }
    });
    return Array.from(waiterMap.entries())
      .map(([id, fullName]) => ({ id, fullName }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [bills]);

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
            onPress={handleOpenFilters}
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
          <ThemedView style={tw`gap-2`}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={tw`gap-2`}
            >
              {/* Payment Method Chip */}
              {filters.paymentMethod && (
                <Pressable
                  onPress={() =>
                    setFilters({ ...filters, paymentMethod: undefined })
                  }
                >
                  <ThemedView
                    style={tw`flex-row items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 border border-primary-300`}
                  >
                    <Ionicons
                      name={getPaymentMethodIcon(filters.paymentMethod as PaymentMethod)}
                      size={14}
                      color={tw.color("primary-700")}
                    />
                    <ThemedText type="small" style={tw`text-primary-700 font-medium`}>
                      {translatePaymentMethod(filters.paymentMethod as PaymentMethod)}
                    </ThemedText>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={tw.color("primary-600")}
                    />
                  </ThemedView>
                </Pressable>
              )}

              {/* Payment Status Chip */}
              {filters.isPaid !== undefined && (
                <Pressable
                  onPress={() => setFilters({ ...filters, isPaid: undefined })}
                >
                  <ThemedView
                    style={tw`flex-row items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 border border-primary-300`}
                  >
                    <Ionicons
                      name={
                        filters.isPaid
                          ? "checkmark-circle-outline"
                          : "time-outline"
                      }
                      size={14}
                      color={tw.color("primary-700")}
                    />
                    <ThemedText type="small" style={tw`text-primary-700 font-medium`}>
                      {filters.isPaid
                        ? t("bills:filters.paid")
                        : t("bills:filters.unpaid")}
                    </ThemedText>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={tw.color("primary-600")}
                    />
                  </ThemedView>
                </Pressable>
              )}

              {/* Waiter Chip */}
              {filters.ownerId && (
                <Pressable
                  onPress={() => setFilters({ ...filters, ownerId: undefined })}
                >
                  <ThemedView
                    style={tw`flex-row items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 border border-primary-300`}
                  >
                    <Ionicons
                      name="person-outline"
                      size={14}
                      color={tw.color("primary-700")}
                    />
                    <ThemedText type="small" style={tw`text-primary-700 font-medium`}>
                      {availableWaiters.find((w) => w.id === filters.ownerId)
                        ?.fullName || t("bills:filters.waiter")}
                    </ThemedText>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={tw.color("primary-600")}
                    />
                  </ThemedView>
                </Pressable>
              )}

              {/* Reset All Chip */}
              <Pressable onPress={handleResetFilters}>
                <ThemedView
                  style={tw`flex-row items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-300`}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={14}
                    color={tw.color("gray-700")}
                  />
                  <ThemedText type="small" style={tw`text-gray-700 font-medium`}>
                    {t("bills:filters.reset")}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            </ScrollView>
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

      {/* Filter Bottom Sheet */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={["60%"]}
        animationConfigs={animationConfigs}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
        enablePanDownToClose
      >
        <BillsFilterBottomSheet
          onApply={handleApplyFilters}
          onClose={handleCloseFilters}
          initialFilters={filters}
          availableWaiters={availableWaiters}
        />
      </BottomSheetModal>
    </ThemedView>
  );
}
