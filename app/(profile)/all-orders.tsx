import { ScrollView, RefreshControl } from "react-native";

import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";

import Fab from "@/presentation/theme/components/fab";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import NewOrderBottomSheet from "@/presentation/orders/new-order-bottom-sheet";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import OrderList from "@/presentation/orders/molecules/order-list";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import WaiterSummaryCard from "@/presentation/orders/components/waiter-summary-card";
import { useActiveOrders } from "@/presentation/orders/hooks/useActiveOrders";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import DailyReportSummaryCard from "@/presentation/home/components/daily-report-summary-card";
import { useQueryClient } from "@tanstack/react-query";
import OrderCard from "@/presentation/home/components/order-card";
import Chip from "@/presentation/theme/components/chip";
import { Order } from "@/core/orders/models/order.model";

export default function AllOrdersScreen() {
  const { t } = useTranslation(["common", "orders"]);
  const orders = useOrdersStore((state) => state.orders);
  const router = useRouter();
  const [selectedWaiterId, setSelectedWaiterId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "all">(
    "all",
  );
  const { refetchOrders, isRefetching } = useActiveOrders();
  const queryClient = useQueryClient();

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const tabs: { label: string; value: OrderStatus | "all" }[] = [
    { label: t("tables:list.filter.all"), value: "all" },
    { label: t("common:status.pending"), value: OrderStatus.PENDING },
    { label: t("common:status.inProgress"), value: OrderStatus.IN_PROGRESS },
    { label: t("common:status.delivered"), value: OrderStatus.DELIVERED },
  ];

  const handleNavigate = () => {
    bottomSheetModalRef.current?.close();
    router.push("/(new-order)/restaurant-menu");
  };

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  const handleRefresh = useCallback(async () => {
    await refetchOrders();
    queryClient.invalidateQueries({ queryKey: ["dailyReport"] });
  }, [refetchOrders]);

  const waiterStats = useMemo(() => {
    const stats = new Map<string, { name: string; count: number }>();
    orders.forEach((order) => {
      const waiterId = order.user.id;
      const waiterName = `${order.user.person.firstName} ${order.user.person.lastName}`;
      if (stats.has(waiterId)) {
        stats.get(waiterId)!.count += 1;
      } else {
        stats.set(waiterId, { name: waiterName, count: 1 });
      }
    });
    return Array.from(stats.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      count: data.count,
    }));
  }, [orders]);

  const filteredOrdersByWaiters = useMemo(() => {
    let ordersByWaiters: Order[] = [];
    if (!selectedWaiterId) ordersByWaiters = orders;
    else
      ordersByWaiters = orders.filter(
        (order) => order.user.id === selectedWaiterId,
      );

    if (selectedStatus === "all") return ordersByWaiters;
    return ordersByWaiters.filter((order) => order.status === selectedStatus);
  }, [orders, selectedWaiterId]);

  const filteredOrders = useMemo(() => {
    if (selectedStatus === "all") return filteredOrdersByWaiters;
    return filteredOrdersByWaiters.filter(
      (order) => order.status === selectedStatus,
    );
  }, [filteredOrdersByWaiters, selectedStatus]);

  const pendingOrders = filteredOrders.filter(
    (order) => order.status === OrderStatus.PENDING,
  );
  const inProgressOrders = filteredOrders.filter(
    (order) => order.status === OrderStatus.IN_PROGRESS,
  );
  const deliveredOrders = filteredOrders.filter(
    (order) => order.status === OrderStatus.DELIVERED,
  );

  return (
    <ScreenLayout style={tw`flex-1`}>
      {orders.length === 0 ? (
        <>
          <ThemedView style={tw`px-4 pt-4`}>
            <DailyReportSummaryCard />
          </ThemedView>
          <ThemedView style={tw`items-center justify-center flex-1 gap-4`}>
            <Ionicons
              name="document-text-outline"
              size={80}
              color={tw.color("gray-500")}
            />
            <ThemedText type="h3">{t("orders:list.noOrders")}</ThemedText>
            <ThemedText type="body2" style={tw`text-center max-w-xs`}>
              {t("orders:list.noOrdersDescription")}
            </ThemedText>
          </ThemedView>
        </>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`pb-20 gap-4`}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor={tw.color("blue-500")}
              colors={[tw.color("blue-500") || "#3b82f6"]}
            />
          }
        >
          <ThemedView style={tw`px-4 pt-4`}>
            <DailyReportSummaryCard />
          </ThemedView>
          {waiterStats.length > 0 && (
            <ThemedView>
              <ThemedText type="h3" style={tw`mb-3 px-4 `}>
                {t("orders:waiterSummary.title")}
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={tw`gap-3 pb-2 px-4`}
              >
                <WaiterSummaryCard
                  waiterId="all"
                  waiterName={t("orders:waiterSummary.all")}
                  orderCount={orders.length}
                  isSelected={selectedWaiterId === null}
                  onPress={() => setSelectedWaiterId(null)}
                />
                {waiterStats.map((waiter) => (
                  <WaiterSummaryCard
                    key={waiter.id}
                    waiterId={waiter.id}
                    waiterName={waiter.name}
                    orderCount={waiter.count}
                    isSelected={selectedWaiterId === waiter.id}
                    onPress={() => setSelectedWaiterId(waiter.id)}
                  />
                ))}
              </ScrollView>
            </ThemedView>
          )}
          {/* <OrderList */}
          {/*   title={t("common:status.pending")} */}
          {/*   orders={pendingOrders} */}
          {/* /> */}
          {/* <OrderList */}
          {/*   title={t("common:status.inProgress")} */}
          {/*   orders={inProgressOrders} */}
          {/* /> */}
          {/* <OrderList */}
          {/*   title={t("common:status.delivered")} */}
          {/*   orders={deliveredOrders} */}
          {/* /> */}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`gap-2 px-4`}
          >
            {tabs.map((tab) => {
              const isActive = tab.value === selectedStatus;
              const activeOrdersCount =
                tab.value === "all"
                  ? filteredOrdersByWaiters.length
                  : filteredOrdersByWaiters.filter(
                      (order) => order.status === tab.value,
                    ).length;

              return (
                <Chip
                  key={tab.value.toString()}
                  onPress={() => setSelectedStatus(tab.value)}
                  selected={isActive}
                  label={tab.label}
                  rightContent={
                    <ThemedText
                      type="small"
                      style={tw`${isActive ? "text-white" : ""}`}
                    >
                      {activeOrdersCount}
                    </ThemedText>
                  }
                />
              );
            })}
          </ScrollView>

          {filteredOrders.length > 0 ? (
            <ThemedView style={tw`px-4`}>
              {filteredOrders.map((order) => (
                <ThemedView key={order.id}>
                  <OrderCard order={order} />
                </ThemedView>
              ))}
            </ThemedView>
          ) : (
            <ThemedView
              style={tw`items-center justify-center flex-1 gap-4 px-4 my-8`}
            >
              <Ionicons
                name="document-text-outline"
                size={80}
                color={tw.color("gray-500")}
              />
              <ThemedText type="h3">{t("orders:list.noOrders")}</ThemedText>
              <ThemedText type="body2" style={tw`text-center max-w-xs`}>
                {t("orders:list.noOrdersDescription")}
              </ThemedText>
            </ThemedView>
          )}
        </ScrollView>
      )}

      <BottomSheetModal
        ref={bottomSheetModalRef}
        onChange={handleSheetChanges}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
      >
        <NewOrderBottomSheet onCreateOrder={handleNavigate} />
      </BottomSheetModal>

      <Fab icon="add-outline" onPress={handlePresentModalPress} />
    </ScreenLayout>
  );
}
