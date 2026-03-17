import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
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
import {
  formatCurrency,
  translatePaymentMethod,
  getPaymentMethodIcon,
} from "@/core/i18n/utils";
import { PaymentMethod } from "@/core/orders/enums/payment-method";
import Button from "@/presentation/theme/components/button";
import DatePicker from "@/presentation/theme/components/date-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { BillStatus } from "@/core/orders/models/bill.model";
import BillCard from "@/presentation/orders/components/bill-card";
import Chip from "@/presentation/theme/components/chip";

const STORAGE_KEY = "sales_selected_date";

export default function SalesScreen() {
  const { t } = useTranslation(["bills", "common", "errors"]);
  const router = useRouter();
  const primaryColor = useThemeColor({}, "primary");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filters, setFilters] = useState<BillListFiltersDto>({});
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  // Load persisted date on mount
  useEffect(() => {
    const loadPersistedDate = async () => {
      try {
        const savedDate = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedDate) {
          setSelectedDate(new Date(savedDate));
        }
      } catch {
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
    } catch {
      // Silently fail
    }
  }, []);

  // Convert date to string format for API
  const dateFilter = dayjs(selectedDate).format("YYYY-MM-DD");

  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 50,
    stiffness: 300,
    mass: 1,
    overshootClamping: true,
  });

  const {
    bills,
    count,
    isLoading,
    isLoadingMore,
    refetch,
    loadMore,
    hasMore,
    reset,
  } = useBillsList({ startDate: dateFilter, ...filters });

  // Reset pagination when date changes
  useEffect(() => {
    reset();
  }, [dateFilter, reset]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await refetch();
    } catch {
      Alert.alert(
        t("errors:order.fetchError"),
        t("errors:order.ordersFetchFailed"),
      );
    } finally {
      setRefreshing(false);
    }
  }, [refetch, t]);

  const handleBillPress = useCallback(
    (bill: any) => {
      router.push(`/(bills)/${bill.id}`);
    },
    [router],
  );

  const handleOpenFilters = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleCloseFilters = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const handleApplyFilters = useCallback(
    (newFilters: BillListFiltersDto) => {
      setFilters(newFilters);
      reset();
      bottomSheetModalRef.current?.dismiss();
    },
    [reset],
  );

  const handleResetFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters =
    filters.paymentMethod !== undefined ||
    filters.status !== undefined ||
    filters.ownerId !== undefined;

  const availableWaiters = useMemo(() => {
    const waiterMap = new Map<string, string>();
    bills.forEach((bill) => {
      if (!waiterMap.has(bill.owner.id)) {
        waiterMap.set(bill.owner.id, bill.owner.person.firstName);
      }
    });
    return Array.from(waiterMap.entries())
      .map(([id, fullName]) => ({ id, fullName }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [bills]);

  const totalAmount = bills.reduce((sum, bill) => sum + bill.total, 0);
  const paidCount = bills.filter((b) => b.status === BillStatus.PAID).length;
  const unpaidCount = bills.filter((b) => b.status !== BillStatus.PAID).length;

  return (
    <>
      <ThemedView style={tw`flex-1 pt-8 bg-light-background`}>
        {/* Header */}
        <ThemedView style={tw`px-4 mb-4 gap-3`}>
          <ThemedView style={tw`flex-row items-center justify-between`}>
            <ThemedText type="h2">{t("common:navigation.sales")}</ThemedText>
            <Pressable
              onPress={handleOpenFilters}
              style={tw`p-2 rounded-lg ${hasActiveFilters ? "bg-primary-50" : "bg-gray-100"}`}
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
          {count > 0 && (
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
                  <ThemedText style={tw`text-green-700`}>
                    {paidCount}
                  </ThemedText>
                  <ThemedText style={tw`text-gray-400`}> / </ThemedText>
                  <ThemedText style={tw`text-orange-700`}>
                    {unpaidCount}
                  </ThemedText>
                </ThemedText>
              </ThemedView>
            </ThemedView>
          )}

          {/* Active filter chips */}
          {hasActiveFilters && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={tw`gap-2`}
            >
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

              {filters.status !== undefined && (
                <Pressable
                  onPress={() => setFilters({ ...filters, status: undefined })}
                >
                  <ThemedView
                    style={tw`flex-row items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 border border-primary-300`}
                  >
                    <Ionicons
                      name={
                        filters.status === BillStatus.PAID
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
                      {filters.status === BillStatus.PAID
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
                    <ThemedText
                      type="small"
                      style={tw`text-primary-700 font-medium`}
                    >
                      {availableWaiters.find((w) => w.id === filters.ownerId)
                        ?.fullName ?? t("bills:filters.waiter")}
                    </ThemedText>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={tw.color("primary-600")}
                    />
                  </ThemedView>
                </Pressable>
              )}

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
          )}
        </ThemedView>

        {/* Date Picker */}
        <ThemedView style={tw`px-4 mb-4`}>
          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            showTodayButton={true}
          />
        </ThemedView>

        <ThemedView style={tw`flex-row gap-2 pb-4 px-4 justify-items-stretch`}>
          <Chip label="All" />
          <Chip label="Paid" />
          <Chip label="Unpaid" />
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
          ) : count > 0 ? (
            <ThemedView style={tw`px-4 gap-4`}>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("bills:list.showingBills", { count })}
              </ThemedText>
              <ThemedView style={tw`bg-white rounded-2xl py-2 `}>
                {bills.map((bill) => (
                  <BillCard
                    key={bill.id}
                    bill={bill}
                    onPress={() => handleBillPress(bill)}
                  />
                ))}
              </ThemedView>
              {hasMore && (
                <Button
                  label={t("common:actions.loadMore")}
                  variant="outline"
                  loading={isLoadingMore}
                  onPress={loadMore}
                />
              )}
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
      </ThemedView>

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
    </>
  );
}
