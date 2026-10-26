import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  ScrollView,
  RefreshControl,
  Alert,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useBillsList } from "@/presentation/orders/hooks/useBillsList";
import { useUsers } from "@/presentation/users/hooks/useUsers";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import Icon from "@/presentation/theme/components/icon";

import BillsFilterBottomSheet from "@/presentation/orders/components/bills-filter-bottom-sheet";
import {
  BillListFiltersDto,
  BillStatusFilter,
} from "@/core/orders/dto/bill-list-filters.dto";
import Chip from "@/presentation/theme/components/chip";
import Button from "@/presentation/theme/components/button";
import DatePicker from "@/presentation/theme/components/date-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import BillCard from "@/presentation/orders/components/bill-card";
import Fab from "@/presentation/theme/components/fab";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import type { Bill } from "@/core/orders/models/bill.model";

const STORAGE_KEY = "sales_selected_date";

interface SalesContentProps {
  /** Overrides navigating to the bill screen, e.g. to open a side pane. */
  onOpenBill?: (bill: Bill) => void;
  /** Bill currently shown in the side pane. */
  activeBillId?: number;
}

export default function SalesContent({
  onOpenBill,
  activeBillId,
}: SalesContentProps = {}) {
  const { t } = useTranslation(["bills", "common", "errors"]);
  const router = useRouter();
  const primaryColor = useThemeColor({}, "primary");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  // Status lives on screen (unpaid first); the sheet holds the other filters
  const [filters, setFilters] = useState<BillListFiltersDto>({
    status: BillStatusFilter.UNPAID,
  });
  const bottomSheetModalRef = useRef<BottomSheetMethods>(null);
  const [fabExpanded, setFabExpanded] = useState(true);
  const lastScrollY = useRef(0);
  const openDraft = useNewOrderStore((state) => state.openDraft);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const { currentRestaurant, user } = useAuthStore();

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

  const {
    bills,
    count,
    isLoading,
    isLoadingMore,
    data,
    refetch,
    loadMore,
    hasMore,
    reset,
  } = useBillsList({ startDate: dateFilter, ...filters });

  // Reset pagination when date or filters change
  useEffect(() => {
    reset();
  }, [
    dateFilter,
    filters.status,
    filters.paymentMethod,
    filters.ownerId,
    filters.source,
    reset,
  ]);

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
    (bill: Bill) => {
      if (onOpenBill) onOpenBill(bill);
      else router.push(`/(bills)/${bill.id}`);
    },
    [router, onOpenBill],
  );

  const handleOpenFilters = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleCloseFilters = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const handleApplyFilters = useCallback(
    (newFilters: BillListFiltersDto) => {
      // The sheet no longer edits status; keep the on-screen choice
      setFilters((prev) => ({ ...newFilters, status: prev.status }));
      reset();
      bottomSheetModalRef.current?.dismiss();
    },
    [reset],
  );

  const handleSelectStatus = (status?: BillStatusFilter) => {
    setFilters((prev) => ({ ...prev, status }));
  };

  const statusChips = [
    { label: t("bills:filters.all"), value: undefined },
    {
      label: t("bills:filters.paidCount"),
      value: BillStatusFilter.PAID,
      count: data?.countPaid ?? 0,
    },
    {
      label: t("bills:filters.unpaidCount"),
      value: BillStatusFilter.UNPAID,
      count: data?.countUnpaid ?? 0,
    },
  ];

  // Empty state follows the status chip, so "unpaid" doesn't read as "no sales"
  const emptyKey =
    filters.status === BillStatusFilter.UNPAID
      ? "noUnpaidBills"
      : filters.status === BillStatusFilter.PAID
        ? "noPaidBills"
        : "noBillsToday";

  const hasActiveFilters =
    filters.paymentMethod !== undefined ||
    filters.ownerId !== undefined ||
    filters.source !== undefined;

  const { users } = useUsers();
  const isAdmin = isAdminLevelRole(user?.role?.name);
  const availableWaiters = useMemo(() => {
    const filteredUsers = isAdmin
      ? users.filter((u) => u.isActive)
      : users.filter((u) => u.isActive && u.id === user?.id);

    return filteredUsers
      .map((u) => ({
        id: u.id,
        fullName: `${u.person.firstName} ${u.person.lastName}`,
      }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [users, user, isAdmin]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentY = event.nativeEvent.contentOffset.y;
      const diff = currentY - lastScrollY.current;
      const SCROLL_THRESHOLD = 10;

      if (Math.abs(diff) > SCROLL_THRESHOLD) {
        setFabExpanded(diff < 0 || currentY <= 0);
        lastScrollY.current = currentY;
      }
    },
    [],
  );

  const onNewSale = () => {
    setActiveOrder(null);
    openDraft("sale");
    router.push("/(new-order)/restaurant-menu");
  };

  return (
    <>
      {/* Header */}
      {/* <ThemedView style={tw`px-4 mb-4 gap-3`}> */}
      {/*   <ThemedView style={tw`flex-row items-center justify-between`}> */}
      {/*     <ThemedText type="h2">{t("common:navigation.sales")}</ThemedText> */}
      {/*   </ThemedView> */}
      {/* </ThemedView> */}

      {/* Date Picker + Filters */}
      <ThemedView style={tw`flex-row items-center gap-2 px-4 mb-4 pt-4`}>
        <ThemedView style={tw`flex-1`}>
          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            showTodayButton={true}
          />
        </ThemedView>
        <Pressable
          onPress={handleOpenFilters}
          accessibilityLabel={t("bills:filters.title")}
          style={tw`p-3 rounded-2xl ${hasActiveFilters ? "bg-surface" : "bg-transparent"}`}
        >
          <Icon
            name="funnel"
            size={20}
            color={hasActiveFilters ? tw.color("on-surface") : tw.color("gray-600")}
          />
        </Pressable>
      </ThemedView>

      {/* Payment status */}
      <ThemedView style={tw`flex-row gap-2 px-4 mb-2`}>
        {statusChips.map((chip) => (
          <Chip
            key={chip.value ?? "all"}
            label={chip.label}
            selected={filters.status === chip.value}
            onPress={() => handleSelectStatus(chip.value)}
            rightContent={
              chip.count !== undefined && (
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {chip.count}
                </ThemedText>
              )
            }
          />
        ))}
      </ThemedView>

      {/* Bills list */}
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pb-20`}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
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
            <ThemedView style={tw` rounded-2xl py-2 gap-4 `}>
              {bills.map((bill) => (
                <BillCard
                  key={bill.id}
                  bill={bill}
                  active={bill.id === activeBillId}
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
            <Icon
              name="receipt-text"
              size={64}
              color={tw.color("gray-300")}
            />
            <ThemedText type="h4" style={tw`text-gray-500 mt-4 text-center`}>
              {t(`bills:list.${emptyKey}`)}
            </ThemedText>
            <ThemedText
              type="body2"
              style={tw`text-gray-400 mt-2 text-center max-w-xs`}
            >
              {t(`bills:list.${emptyKey}Description`)}
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>
      <Fab
        icon="plus"
        label={t("bills:list.newSale")}
        expanded={fabExpanded}
        onPress={onNewSale}
      />

      {/* Filter Bottom Sheet */}
      <ThemedBottomSheetModal ref={bottomSheetModalRef} enablePanDownToClose>
        <BillsFilterBottomSheet
          onApply={handleApplyFilters}
          onClose={handleCloseFilters}
          initialFilters={filters}
          availableWaiters={availableWaiters}
          isAdmin={isAdmin}
          showStatusFilter={false}
        />
      </ThemedBottomSheetModal>
    </>
  );
}
