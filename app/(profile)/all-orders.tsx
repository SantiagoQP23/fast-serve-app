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

export default function AllOrdersScreen() {
  const { t } = useTranslation(["common", "orders"]);
  const orders = useOrdersStore((state) => state.orders);
  const router = useRouter();
  const [selectedWaiterId, setSelectedWaiterId] = useState<string | null>(null);
  const { refetchOrders, isRefetching } = useActiveOrders();

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

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

  const filteredOrders = useMemo(() => {
    if (!selectedWaiterId) return orders;
    return orders.filter((order) => order.user.id === selectedWaiterId);
  }, [orders, selectedWaiterId]);

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
          <OrderList
            title={t("common:status.pending")}
            orders={pendingOrders}
          />
          <OrderList
            title={t("common:status.inProgress")}
            orders={inProgressOrders}
          />
          <OrderList
            title={t("common:status.delivered")}
            orders={deliveredOrders}
          />
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
