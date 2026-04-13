import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { ScrollView, RefreshControl, Alert } from "react-native";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useOrderHistory } from "@/presentation/orders/hooks/useOrderHistory";
import { useUsers } from "@/presentation/users/hooks/useUsers";
import * as Haptics from "expo-haptics";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import Button from "@/presentation/theme/components/button";
import DatePicker from "@/presentation/theme/components/date-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import OrderCard from "@/presentation/home/components/order-card";
import Chip from "@/presentation/theme/components/chip";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import IconButton from "@/presentation/theme/components/icon-button";
import Select from "@/presentation/theme/components/select";
import { OrderHistoryFiltersDto } from "@/core/orders/dto/order-history-filters.dto";
import { formatCurrency } from "@/core/i18n/utils";

const STORAGE_KEY = "history_selected_date";
const FILTERS_STORAGE_KEY = "history_filters";

export default function HistoryScreen() {
  const { t } = useTranslation(["common", "orders", "errors"]);
  const primaryColor = useThemeColor({}, "primary");
  const [refreshing, setRefreshing] = useState(false);
  const [showTotalAmount, setShowTotalAmount] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filters, setFilters] = useState<OrderHistoryFiltersDto>({});
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { currentRestaurant, user } = useAuthStore();

  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 50,
    stiffness: 300,
    mass: 1,
    overshootClamping: true,
  });

  // Load persisted date and filters on mount
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const [savedDate, savedFilters] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(FILTERS_STORAGE_KEY),
        ]);
        if (savedDate) {
          setSelectedDate(new Date(savedDate));
        }
        if (savedFilters) {
          setFilters(JSON.parse(savedFilters));
        }
      } catch {
        // Silently fail, keep default values
      }
    };
    loadPersistedData();
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

  // Handle filter changes
  const handleFiltersChange = useCallback(
    async (newFilters: OrderHistoryFiltersDto) => {
      setFilters(newFilters);
      try {
        await AsyncStorage.setItem(
          FILTERS_STORAGE_KEY,
          JSON.stringify(newFilters),
        );
      } catch {
        // Silently fail
      }
    },
    [],
  );

  const dateFilter = dayjs(selectedDate).format("YYYY-MM-DD");

  const {
    orders,
    count,
    totalAmount,
    isLoading,
    isLoadingMore,
    refetch,
    loadMore,
    hasMore,
    reset,
  } = useOrderHistory({ startDate: dateFilter, ...filters });

  // Reset pagination when date or filters change
  useEffect(() => {
    reset();
  }, [dateFilter, filters.userId, reset]);

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

  const { users } = useUsers();
  const isAdmin = user?.role?.name === "admin";
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

  const hasActiveFilters = filters.userId !== undefined;

  const removeFilters = useCallback(async () => {
    setFilters({});
    reset();
    try {
      await AsyncStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify({}));
    } catch {
      // Silently fail
    }
  }, [reset]);

  // Bottom sheet filter state
  const [selectedUserId, setSelectedUserId] = useState<string | "all">("all");

  const userOptions = useMemo(
    () => [
      { label: t("common:filters.allUsers"), value: "all" },
      ...availableWaiters.map((waiter) => ({
        label: waiter.fullName,
        value: waiter.id,
      })),
    ],
    [availableWaiters, t],
  );

  const handleOpenFilters = useCallback(() => {
    setSelectedUserId(filters.userId || "all");
    bottomSheetModalRef.current?.present();
  }, [filters.userId]);

  const handleCloseFilters = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const handleApplyFilters = useCallback(async () => {
    const newFilters: OrderHistoryFiltersDto = {};
    if (selectedUserId !== "all") {
      newFilters.userId = selectedUserId;
    }
    await handleFiltersChange(newFilters);
    reset();
    bottomSheetModalRef.current?.dismiss();
  }, [selectedUserId, handleFiltersChange, reset]);

  const handleResetFilters = useCallback(() => {
    setSelectedUserId("all");
    removeFilters();
    bottomSheetModalRef.current?.dismiss();
  }, [removeFilters]);
  const formattedTotalAmount = formatCurrency(totalAmount);
  const displayedTotalAmount = showTotalAmount
    ? formattedTotalAmount
    : formattedTotalAmount.replace(/\d/g, "*");

  return (
    <>
      <ScreenLayout style={tw`flex-1`}>
        {/* Header */}
        <ThemedView style={tw`px-4 mb-4 gap-3`}>
          {/* Active filter chips */}
          {hasActiveFilters && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={tw`gap-2`}
            >
              {filters.userId && (
                <Chip
                  label={
                    availableWaiters.find((w) => w.id === filters.userId)
                      ?.fullName ?? t("common:filters.user")
                  }
                  selected
                  onPress={() =>
                    handleFiltersChange({ ...filters, userId: undefined })
                  }
                  icon="close"
                />
              )}
              <Chip
                label={t("common:actions.clearAll")}
                onPress={removeFilters}
              />
            </ScrollView>
          )}
        </ThemedView>

        {/* Date Picker */}
        <ThemedView style={tw`flex-row items-center gap-2 px-4 mb-4`}>
          <ThemedView style={tw`flex-1`}>
            <DatePicker
              value={selectedDate}
              onChange={handleDateChange}
              showTodayButton={true}
            />
          </ThemedView>

          <IconButton
            icon="filter"
            onPress={handleOpenFilters}
            variant={hasActiveFilters ? "filled" : "text"}
          />
        </ThemedView>

        <ThemedView style={tw`px-4 mb-4 items-center`}>
          <ThemedView style={tw`flex-row items-center gap-2`}>
            <ThemedText type="h2">{displayedTotalAmount}</ThemedText>
            <IconButton
              icon={showTotalAmount ? "eye-off-outline" : "eye-outline"}
              onPress={() => setShowTotalAmount((prev) => !prev)}
              variant="text"
              size={18}
              style={tw`p-0`}
            />
          </ThemedView>
          <ThemedText type="small" style={tw`text-gray-400`}>
            {count} {count === 1 ? "order" : "orders"}
          </ThemedText>
        </ThemedView>

        {/* Orders list */}
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
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
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
                {t("orders:list.noOrders")}
              </ThemedText>
              <ThemedText
                type="body2"
                style={tw`text-gray-400 mt-2 text-center max-w-xs`}
              >
                {t("orders:list.noOrdersDescription")}
              </ThemedText>
            </ThemedView>
          )}
        </ScrollView>
      </ScreenLayout>

      {/* Filter Bottom Sheet */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={["40%"]}
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
        <BottomSheetView style={tw`p-4`}>
          <ThemedView style={tw`w-full gap-6`}>
            {/* Header */}
            <ThemedText type="h3" style={tw`text-center`}>
              {t("common:actions.filter")}
            </ThemedText>

            {/* User Select - Only show for admin users */}
            {isAdmin && (
              <Select
                label={t("common:filters.user")}
                placeholder={t("common:filters.allUsers")}
                options={userOptions}
                value={selectedUserId}
                onChange={(value) => setSelectedUserId(value as string)}
              />
            )}

            {/* Action Buttons */}
            <ThemedView style={tw`flex-row gap-3`}>
              <ThemedView style={tw`flex-1`}>
                <Button
                  label={t("bills:filters.reset")}
                  onPress={handleResetFilters}
                  variant="outline"
                />
              </ThemedView>
              <ThemedView style={tw`flex-1`}>
                <Button
                  label={t("bills:filters.apply")}
                  onPress={handleApplyFilters}
                />
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}
