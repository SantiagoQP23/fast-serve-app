import { ScrollView, RefreshControl, Alert, Pressable } from "react-native";

import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";

import Fab from "@/presentation/theme/components/fab";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import NewOrderBottomSheet from "@/presentation/orders/new-order-bottom-sheet";
import IconButton from "@/presentation/theme/components/icon-button";
import NotificationBadge from "@/presentation/theme/components/notification-badge";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import OrderList from "@/presentation/orders/molecules/order-list";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { getRelativeTime } from "@/core/i18n/utils";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useQueryClient } from "@tanstack/react-query";
import StatsCard from "@/presentation/home/components/stats-card";
import { useDashboardStats } from "@/presentation/orders/hooks/useDashboardStats";
import { useActiveOrders } from "@/presentation/orders/hooks/useActiveOrders";
import ProgressBar from "@/presentation/theme/components/progress-bar";
import OrderDetailCard from "@/presentation/orders/components/order-detail-card";
import ButtonGroup from "@/presentation/theme/components/button-group";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import CollapsibleOrderSection from "@/presentation/orders/components/collapsible-order-section";
import { useClosedOrders } from "@/presentation/orders/hooks/useClosedOrders";

export default function HomeScreen() {
  const { t } = useTranslation(["common", "orders", "errors"]);
  const { user } = useAuthStore();
  const orders = useOrdersStore((state) => state.orders).filter(
    (order) => order.user.id === user?.id,
  );
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const setActiveOrderDetail = useOrdersStore(
    (state) => state.setActiveOrderDetail,
  );
  const router = useRouter();
  const details = useNewOrderStore((state) => state.details);
  const queryClient = useQueryClient();
  const { currentRestaurant } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState<
    "pending-products" | "order-lists"
  >("pending-products");
  const primaryColor = useThemeColor({}, "primary");
  useActiveOrders();
  const {
    dashboardStats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useDashboardStats();

  // Closed orders hook
  const {
    closedOrders,
    totalCount: closedOrdersCount,
    isLoading: isLoadingClosedOrders,
    refetch: refetchClosedOrders,
    loadMore: loadMoreClosedOrders,
    hasMore: hasMoreClosedOrders,
  } = useClosedOrders();

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

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      // Trigger haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Refetch orders and stats using the centralized query
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: ["activeOrders", currentRestaurant?.id],
        }),
        refetchStats(),
      ]);
    } catch {
      Alert.alert(
        t("errors:order.fetchError"),
        t("errors:order.ordersFetchFailed"),
      );
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, currentRestaurant?.id, t, refetchStats]);

  const pendingOrders = orders.filter(
    (order) => order.status === OrderStatus.PENDING,
  );
  const inProgressOrders = orders.filter(
    (order) => order.status === OrderStatus.IN_PROGRESS,
  );
  const deliveredOrders = orders.filter(
    (order) => order.status === OrderStatus.DELIVERED,
  );

  const haveAnOpenOrder = details.length > 0;

  const collectionRate: number =
    (dashboardStats?.totalIncome || 0) / (dashboardStats?.totalAmount || 1);

  const handleOpenOrder = useCallback(
    (orderNum: number, orderId: string) => {
      const order = orders.find((o) => o.id === orderId);
      if (order) {
        setActiveOrder(order);
        router.push(`/(order)/${orderNum}`);
      }
    },
    [orders, setActiveOrder, router],
  );

  const handleEditOrderDetail = useCallback(
    (orderNum: number, orderId: string, detail: any) => {
      const order = orders.find((o) => o.id === orderId);
      if (order) {
        setActiveOrder(order);
        setActiveOrderDetail(detail);
        router.push(`/(order)/${orderNum}/edit-order-detail`);
      }
    },
    [orders, setActiveOrder, setActiveOrderDetail, router],
  );

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
        <ThemedText type="body1">{t("common:greetings.hello")},</ThemedText>
        <ThemedText type="h2" style={tw`mt-1`}>
          {user?.person.firstName}!
        </ThemedText>
      </ThemedView>

      {/* Stats Cards */}

      <ScrollView
        contentContainerStyle={tw`pb-20 gap-4`}
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
        <ThemedView style={tw`px-4 mb-4 gap-4`}>
          <ThemedView style={tw`gap-4 rounded-lg `}>
            <ThemedView style={tw`bg-transparent gap-1 `}>
              <ThemedText type="small" style={tw``}>
                {t("common:stats.totalAmount")}
              </ThemedText>
              <ThemedText style={tw`text-6xl `}>
                {`${t("common:currency.symbol")}${dashboardStats?.totalAmount?.toFixed(2) ?? "0.00"}`}
              </ThemedText>
            </ThemedView>
            <ProgressBar
              height={2}
              progress={
                (dashboardStats?.totalIncome || 0) /
                (dashboardStats?.totalAmount || 1)
              }
            />
            <ThemedView style={tw`flex-1 flex-row  items-center gap-1`}>
              <ThemedText type="small" style={tw``}>
                {t("common:stats.totalIncome")}:
              </ThemedText>
              <ThemedText
                type="body1"
                style={[tw`font-semibold text-light-primary`]}
              >
                {`${t("common:currency.symbol")}${dashboardStats?.totalIncome?.toFixed(2) ?? "0.00"}`}
              </ThemedText>
            </ThemedView>
          </ThemedView>
          <ThemedView style={tw`flex-row gap-4`}>
            <StatsCard
              title={t("common:stats.totalOrders")}
              value={dashboardStats?.totalOrders ?? 0}
              icon="receipt-outline"
              loading={isLoadingStats}
            />
            <StatsCard
              title={t("common:stats.ordersPendingPayment")}
              value={orders.filter((order) => !order.isPaid).length}
              icon="receipt-outline"
              loading={isLoadingStats}
            />
          </ThemedView>
        </ThemedView>

        {orders.length === 0 ? (
          <ThemedView
            style={tw` items-center justify-center flex-1 gap-4 mt-20`}
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
        ) : (
          <ThemedView style={tw`gap-6`}>
            {/* ButtonGroup for view toggle */}
            <ThemedView style={tw`px-4`}>
              <ButtonGroup
                options={[
                  {
                    label: t("orders:views.products"),
                    value: "pending-products",
                  },
                  { label: t("orders:views.orders"), value: "order-lists" },
                ]}
                selected={selectedView}
                onChange={setSelectedView}
              />
            </ThemedView>

            {/* Pending Products View */}
            {selectedView === "pending-products" && (
              <>
                {orders.some((order) =>
                  order.details.some(
                    (detail) => detail.quantity !== detail.qtyDelivered,
                  ),
                ) ? (
                  <ThemedView style={tw`px-4`}>
                    <ThemedText type="h3" style={tw`mb-4 font-semibold`}>
                      {t("orders:list.pendingProducts")}
                    </ThemedText>
                    {orders
                      .filter((order) =>
                        order.details.some(
                          (detail) => detail.quantity !== detail.qtyDelivered,
                        ),
                      )
                      .map((order) => {
                        const pendingCount = order.details.filter(
                          (detail) => detail.quantity !== detail.qtyDelivered,
                        ).length;
                        const relativeTime = getRelativeTime(order.createdAt);

                        return (
                          <ThemedView key={order.id} style={tw`mb-8`}>
                            <Pressable
                              onPress={() =>
                                handleOpenOrder(order.num, order.id)
                              }
                            >
                              <ThemedView style={tw`mb-4`}>
                                <ThemedView
                                  style={tw`flex-row items-center justify-between`}
                                >
                                  <ThemedText
                                    type="body1"
                                    style={tw`font-semibold`}
                                  >
                                    {order.type === OrderType.IN_PLACE
                                      ? `${t("common:labels.table")} ${order.table?.name}`
                                      : t("common:labels.takeAway")}{" "}
                                    -{" "}
                                    {t("orders:details.orderNumber", {
                                      num: order.num,
                                    })}
                                  </ThemedText>
                                  <Ionicons
                                    name="chevron-forward"
                                    size={20}
                                    color={tw.color("gray-500")}
                                  />
                                </ThemedView>
                                <ThemedView
                                  style={tw`flex-row items-center gap-2 mt-1`}
                                >
                                  <ThemedText
                                    type="small"
                                    style={tw`text-gray-500`}
                                  >
                                    {relativeTime}
                                  </ThemedText>
                                  <ThemedText
                                    type="small"
                                    style={tw`text-gray-500`}
                                  >
                                    •
                                  </ThemedText>
                                  <ThemedText
                                    type="small"
                                    style={tw`text-gray-500`}
                                  >
                                    {pendingCount}{" "}
                                    {t("orders:list.itemsPending")}
                                  </ThemedText>
                                  {!order.isPaid && (
                                    <>
                                      <ThemedText
                                        type="small"
                                        style={tw`text-gray-500`}
                                      >
                                        •
                                      </ThemedText>
                                      <ThemedText
                                        type="small"
                                        style={tw`text-orange-500 font-semibold`}
                                      >
                                        {t("orders:list.unpaid")}
                                      </ThemedText>
                                    </>
                                  )}
                                </ThemedView>
                              </ThemedView>
                            </Pressable>
                            <ThemedView style={tw`gap-4`}>
                              {order.details
                                .filter(
                                  (detail) =>
                                    detail.quantity !== detail.qtyDelivered,
                                )
                                .map((detail) => (
                                  <OrderDetailCard
                                    key={detail.id}
                                    detail={detail}
                                    orderId={order.id}
                                    onPress={() =>
                                      handleEditOrderDetail(
                                        order.num,
                                        order.id,
                                        detail,
                                      )
                                    }
                                  />
                                ))}
                            </ThemedView>
                          </ThemedView>
                        );
                      })}
                  </ThemedView>
                ) : (
                  <ThemedView
                    style={tw`items-center justify-center flex-1 gap-4 mt-20`}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={80}
                      color={tw.color("green-500")}
                    />
                    <ThemedText type="h3">
                      {t("orders:list.noPendingProducts")}
                    </ThemedText>
                    <ThemedText type="body2" style={tw`text-center max-w-xs`}>
                      {t("orders:list.noPendingProductsDescription")}
                    </ThemedText>
                  </ThemedView>
                )}
              </>
            )}

            {/* Order Lists View */}
            {selectedView === "order-lists" && (
              <>
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
                {/* Collapsible Closed Orders Section */}
                <CollapsibleOrderSection
                  title={t("orders:list.closedOrders")}
                  totalCount={closedOrdersCount}
                  orders={closedOrders}
                  isLoading={isLoadingClosedOrders}
                  onExpand={refetchClosedOrders}
                  hasMore={hasMoreClosedOrders}
                  onLoadMore={loadMoreClosedOrders}
                />
              </>
            )}
          </ThemedView>
        )}
      </ScrollView>
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
