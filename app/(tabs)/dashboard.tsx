import React, {
  useCallback,
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import {
  ScrollView,
  RefreshControl,
  Alert,
  Pressable,
  FlatList,
} from "react-native";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import DailyReportSummaryCard from "@/presentation/home/components/daily-report-summary-card";
import PaymentMethodSummaryCard from "@/presentation/home/components/payment-method-summary-card";
import DashboardBillCard from "@/presentation/home/components/dashboard-bill-card";
import * as Haptics from "expo-haptics";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import DatePicker from "@/presentation/theme/components/date-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import BillsFilterBottomSheet from "@/presentation/orders/components/bills-filter-bottom-sheet";
import { BillListFiltersDto } from "@/core/orders/dto/bill-list-filters.dto";
import { useBillsList } from "@/presentation/orders/hooks/useBillsList";
import {
  formatCurrency,
  translatePaymentMethod,
  getPaymentMethodIcon,
} from "@/core/i18n/utils";
import { PaymentMethod } from "@/core/orders/enums/payment-method";
import { useRouter } from "expo-router";
import { BillListItemDto } from "@/core/orders/dto/bill-list-response.dto";
import IconButton from "@/presentation/theme/components/icon-button";
import Button from "@/presentation/theme/components/button";
import StatsCard from "@/presentation/home/components/stats-card";

const STORAGE_KEY = "dashboard_selected_date";

export default function DashboardScreen() {
  const { t } = useTranslation(["common", "errors", "bills"]);
  const { currentRestaurant } = useAuthStore();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filters, setFilters] = useState<BillListFiltersDto>({});
  const primaryColor = useThemeColor({}, "primary");
  const queryClient = useQueryClient();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  // Animation config for smooth, iOS-like bottom sheet animations
  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 50,
    stiffness: 300,
    mass: 1,
    overshootClamping: true,
  });

  // Load persisted date on mount
  useEffect(() => {
    const loadPersistedDate = async () => {
      try {
        const savedDate = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedDate) {
          setSelectedDate(new Date(savedDate));
        }
      } catch (error) {
        // Silently fail, keep default date
      }
    };
    loadPersistedDate();
  }, []);

  // Persist date whenever it changes
  const handleDateChange = useCallback(async (date: Date) => {
    setSelectedDate(date);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, date.toISOString());
    } catch (error) {
      // Silently fail
    }
  }, []);

  // Convert date to ISO string format for API
  const dateFilter = dayjs(selectedDate).format("YYYY-MM-DD");

  // Fetch bills with filters and date
  const billsFilters: BillListFiltersDto = {
    startDate: dateFilter,
    endDate: dateFilter,
    ...filters,
  };
  const {
    bills,
    count,
    isLoading: billsLoading,
    isLoadingMore,
    refetch: refetchBills,
    loadMore,
    reset: resetBillsPagination,
    hasMore,
  } = useBillsList(billsFilters);

  // Reset pagination when date changes
  useEffect(() => {
    resetBillsPagination();
  }, [dateFilter, resetBillsPagination]);

  // Filter handlers
  const handleOpenFilters = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleCloseFilters = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const handleApplyFilters = useCallback(
    (newFilters: BillListFiltersDto) => {
      setFilters(newFilters);
      resetBillsPagination();
      bottomSheetModalRef.current?.dismiss();
    },
    [resetBillsPagination],
  );

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

  // Bill press handler
  const handleBillPress = useCallback(
    (billItem: BillListItemDto) => {
      router.push(`/(order-view)/${billItem.order.id}`);
    },
    [router],
  );

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      // Trigger haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Refetch daily report, payment method report, and bills list with current date filter
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: [
            "dailyReport",
            currentRestaurant?.id,
            { startDate: dateFilter, endDate: dateFilter },
          ],
        }),
        queryClient.refetchQueries({
          queryKey: [
            "paymentMethodReport",
            currentRestaurant?.id,
            { startDate: dateFilter, endDate: dateFilter },
          ],
        }),
        refetchBills(),
      ]);
    } catch {
      Alert.alert(
        t("errors:order.fetchError"),
        t("errors:order.ordersFetchFailed"),
      );
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, currentRestaurant?.id, dateFilter, refetchBills, t]);

  return (
    <ThemedView style={tw`flex-1 pt-8`}>
      <ThemedView style={tw`px-4 mb-4`}>
        <ThemedText type="h2">{t("common:navigation.dashboard")}</ThemedText>
      </ThemedView>

      {/* Date Picker */}
      <ThemedView style={tw`px-4 mb-4`}>
        <DatePicker
          value={selectedDate}
          onChange={handleDateChange}
          showTodayButton={true}
        />
      </ThemedView>

      <ScrollView
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
        <ThemedView style={tw`px-4`}>
          <DailyReportSummaryCard startDate={dateFilter} endDate={dateFilter} />
          <PaymentMethodSummaryCard
            startDate={dateFilter}
            endDate={dateFilter}
          />

          {/* Bills Section */}
          <ThemedView style={tw`mb-4`}>
            {/* Section Header with Filter Button */}
            <ThemedView style={tw`flex-row items-center justify-between mb-3`}>
              <ThemedText type="h4">{t("bills:bills")}</ThemedText>
              <IconButton
                icon="filter"
                variant={hasActiveFilters ? "filled" : "outlined"}
                onPress={handleOpenFilters}
              />
              {/* <Pressable */}
              {/*   onPress={handleOpenFilters} */}
              {/*   style={tw`p-2 rounded-lg ${ */}
              {/*     hasActiveFilters ? "bg-primary-50" : "bg-gray-100" */}
              {/*   }`} */}
              {/* > */}
              {/*   <Ionicons */}
              {/*     name="filter" */}
              {/*     size={20} */}
              {/*     color={ */}
              {/*       hasActiveFilters */}
              {/*         ? tw.color("primary-600") */}
              {/*         : tw.color("gray-600") */}
              {/*     } */}
              {/*   /> */}
              {/* </Pressable> */}
            </ThemedView>

            {/* Summary Stats */}
            {bills.length > 0 && (
              <ThemedView style={tw`flex-row gap-3 mb-3`}>
                <StatsCard
                  title={t("common:labels.total")}
                  value={formatCurrency(totalAmount)}
                  icon="receipt-outline"
                />
                <StatsCard
                  title={t("bills:details.unpaid")}
                  value={unpaidCount.toString()}
                  icon="checkmark-circle-outline"
                />
                {/* <ThemedView style={tw`flex-1 bg-light-surface p-3 rounded-xl `}> */}
                {/*   <ThemedText type="caption" style={tw`text-gray-500 mb-1`}> */}
                {/*     {t("bills:details.paid")} / {t("bills:details.unpaid")} */}
                {/*   </ThemedText> */}
                {/*   <ThemedText type="h4"> */}
                {/*     <ThemedText style={tw`text-green-700`}> */}
                {/*       {paidCount} */}
                {/*     </ThemedText> */}
                {/*     <ThemedText style={tw`text-gray-400`}> / </ThemedText> */}
                {/*     <ThemedText style={tw`text-orange-700`}> */}
                {/*       {unpaidCount} */}
                {/*     </ThemedText> */}
                {/*   </ThemedText> */}
                {/* </ThemedView> */}
              </ThemedView>
            )}

            {/* Active Filters Chips */}
            {hasActiveFilters && (
              <ThemedView style={tw`mb-3`}>
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
                          name={getPaymentMethodIcon(
                            filters.paymentMethod as PaymentMethod,
                          )}
                          size={14}
                          color={tw.color("primary-700")}
                        />
                        <ThemedText
                          type="small"
                          style={tw`text-primary-700 font-medium`}
                        >
                          {translatePaymentMethod(
                            filters.paymentMethod as PaymentMethod,
                          )}
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
                      onPress={() =>
                        setFilters({ ...filters, isPaid: undefined })
                      }
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
                        <ThemedText
                          type="small"
                          style={tw`text-primary-700 font-medium`}
                        >
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
                      onPress={() =>
                        setFilters({ ...filters, ownerId: undefined })
                      }
                    >
                      <ThemedView
                        style={tw`flex-row items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 border border-primary-300`}
                      >
                        <Ionicons
                          name="person-outline"
                          size={14}
                          color={tw.color("primary-700")}
                        />
                        <ThemedText
                          type="small"
                          style={tw`text-primary-700 font-medium`}
                        >
                          {availableWaiters.find(
                            (w) => w.id === filters.ownerId,
                          )?.fullName || t("bills:filters.waiter")}
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
                      <ThemedText
                        type="small"
                        style={tw`text-gray-700 font-medium`}
                      >
                        {t("bills:filters.reset")}
                      </ThemedText>
                    </ThemedView>
                  </Pressable>
                </ScrollView>
              </ThemedView>
            )}

            {/* Bills List */}
            {billsLoading && !refreshing && bills.length === 0 ? (
              <ThemedView style={tw`py-20 items-center`}>
                <ThemedText type="body2" style={tw`text-gray-400`}>
                  {t("common:status.loading")}
                </ThemedText>
              </ThemedView>
            ) : bills.length > 0 ? (
              <>
                <ThemedView style={tw`bg-white rounded-2xl `}>
                  <FlatList
                    data={bills}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                      <DashboardBillCard
                        bill={item}
                        onPress={() => handleBillPress(item)}
                      />
                    )}
                    scrollEnabled={false}
                    contentContainerStyle={tw`py-2`}
                  />
                </ThemedView>

                {/* Load More Button */}
                {hasMore && (
                  <ThemedView style={tw`mt-4`}>
                    <Button
                      label={
                        isLoadingMore
                          ? t("common:labels.loading")
                          : t("common:actions.loadMore")
                      }
                      onPress={loadMore}
                      variant="outline"
                      disabled={isLoadingMore}
                      loading={isLoadingMore}
                    />
                  </ThemedView>
                )}
              </>
            ) : (
              <ThemedView style={tw`py-20 items-center px-4`}>
                <Ionicons
                  name="receipt-outline"
                  size={64}
                  color={tw.color("gray-300")}
                />
                <ThemedText
                  type="h4"
                  style={tw`text-gray-500 mt-4 text-center`}
                >
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
          </ThemedView>
        </ThemedView>
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
