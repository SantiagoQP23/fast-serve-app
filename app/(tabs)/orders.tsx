import { ScrollView, Dimensions } from "react-native";

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";

import Fab from "@/presentation/theme/components/fab";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import NewOrderBottomSheet from "@/presentation/orders/new-order-bottom-sheet";
import IconButton from "@/presentation/theme/components/icon-button";
import NotificationBadge from "@/presentation/theme/components/notification-badge";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import OrderList from "@/presentation/orders/molecules/order-list";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import WaiterSummaryCard from "@/presentation/orders/components/waiter-summary-card";

export default function OrdersScreen() {
  const { t } = useTranslation(["common", "orders"]);
  const { user } = useAuthStore();
  const orders = useOrdersStore((state) => state.orders);
  const router = useRouter();
  const details = useNewOrderStore((state) => state.details);
  const [selectedWaiterId, setSelectedWaiterId] = useState<string | null>(null);

  // ref
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const handleNavigate = () => {
    bottomSheetModalRef.current?.close(); // Close sheet before navigating
    router.push("/restaurant-menu"); // Navigate to New Order screen
  };

  // callbacks
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  // Group orders by waiter
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

  // Filter orders by selected waiter
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

  const haveAnOpenOrder = details.length > 0;

  return (
    <ThemedView style={tw` pt-8 flex-1 `}>
      <ThemedView style={tw`mb-6 px-4`}>
        <ThemedView
          style={tw`absolute  rounded-full items-center justify-center  z-10 right-2 top-2`}
        >
          {haveAnOpenOrder && (
            <ThemedView style={tw`relative`}>
              <IconButton
                icon="cart-outline"
                onPress={() => router.push("/(new-order)/cart")}
              />
              <NotificationBadge value={details.length} />
            </ThemedView>
          )}
        </ThemedView>
        <ThemedText type="h1" style={tw`mt-1`}>
          {t("orders:list.title")}
        </ThemedText>
      </ThemedView>
      {orders.length === 0 ? (
        <>
          <ThemedView style={tw` items-center justify-center flex-1 gap-4`}>
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
        >
          {/* Waiters Overview Section */}
          {waiterStats.length > 0 && (
            <ThemedView style={tw``}>
              <ThemedText type="h3" style={tw`mb-3 px-4`}>
                {t("orders:waiterSummary.title")}
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={tw`gap-3 pb-2 px-4`}
              >
                {/* All Waiters Card */}
                <WaiterSummaryCard
                  waiterId="all"
                  waiterName={t("orders:waiterSummary.all")}
                  orderCount={orders.length}
                  isSelected={selectedWaiterId === null}
                  onPress={() => setSelectedWaiterId(null)}
                />
                {/* Individual Waiter Cards */}
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

          {/* Order Lists */}
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
    </ThemedView>
  );
}
