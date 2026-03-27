import { ScrollView, RefreshControl, Alert, Pressable } from "react-native";

import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";

import Fab from "@/presentation/theme/components/fab";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import useOrdersModuleContext from "./orders-module.context";
import * as Haptics from "expo-haptics";
import NewOrderBottomSheet from "@/presentation/orders/new-order-bottom-sheet";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
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
import { OrderType } from "@/core/orders/enums/order-type.enum";
import Popover, {
  AnchorPosition,
} from "@/presentation/theme/components/popover";
import CollapsibleOrderSection from "@/presentation/orders/components/collapsible-order-section";
import { useClosedOrders } from "@/presentation/orders/hooks/useClosedOrders";
import Button from "@/presentation/theme/components/button";

export default function MyOrdersScreen() {
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
  const queryClient = useQueryClient();
  const { currentRestaurant } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState<
    "pending-products" | "order-lists"
  >("pending-products");
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [popoverAnchor, setPopoverAnchor] = useState<AnchorPosition | null>(
    null,
  );
  const primaryColor = useThemeColor({}, "primary");
  const { registerOpenViewPopover } = useOrdersModuleContext();
  useActiveOrders();

  useEffect(() => {
    registerOpenViewPopover((anchor) => {
      setPopoverAnchor(anchor);
      setPopoverVisible(true);
    });
  }, []);

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
    bottomSheetModalRef.current?.close();
    router.push("/(new-order)/restaurant-menu");
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
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    <ThemedView style={tw`flex-1 bg-light-background`}>
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
        <ThemedView style={tw`px-4`}>
          <ThemedText type="body1">{t("common:greetings.hello")},</ThemedText>
          <ThemedText type="h2" style={tw`mt-1`}>
            {user?.person.firstName}!
          </ThemedText>
        </ThemedView>
        <ThemedView style={tw`px-4 mb-4 gap-4`}>
          <ThemedView style={tw`gap-4 rounded-lg `}>
            <ThemedView style={tw`bg-transparent gap-1 `}>
              <ThemedText type="small" style={tw``}>
                {t("common:stats.totalAmount")}
              </ThemedText>
              <ThemedText style={tw`text-5xl `}>
                {`${t("common:currency.symbol")}${dashboardStats?.totalAmount?.toFixed(2) ?? "0.00"}`}
              </ThemedText>
            </ThemedView>
            <ThemedView style={tw`gap-2`}>
              <ThemedView
                style={tw`flex-row justify-between items-center gap-1`}
              >
                <ThemedText type="small" style={tw``}>
                  {t("common:stats.totalIncome")}
                </ThemedText>
                <ThemedText
                  type="body1"
                  style={tw`font-semibold text-light-primary`}
                >
                  {`${t("common:currency.symbol")}${dashboardStats?.totalIncome?.toFixed(2) ?? "0.00"}`}
                </ThemedText>
              </ThemedView>
              <ProgressBar
                height={2}
                progress={
                  (dashboardStats?.totalIncome || 0) /
                  (dashboardStats?.totalAmount || 1)
                }
              />
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
            {/* Pending Products View */}
            {selectedView === "pending-products" && (
              <>
                {orders.some((order) =>
                  order.details.some(
                    (detail) => detail.quantity !== detail.qtyDelivered,
                  ),
                ) ? (
                  <ThemedView style={tw`px-4`}>
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
                          <ThemedView
                            key={order.id}
                            style={tw`mb-8 bg-light-surface rounded-lg p-4`}
                          >
                            <Pressable
                              onPress={() =>
                                handleOpenOrder(order.num, order.id)
                              }
                            >
                              <ThemedView style={tw`mb-4 bg-transparent`}>
                                <ThemedView
                                  style={tw`flex-row items-center justify-between bg-transparent`}
                                >
                                  <ThemedText
                                    type="h3"
                                    style={tw`font-semibold`}
                                  >
                                    {order.type === OrderType.IN_PLACE
                                      ? `${t("common:labels.table")} ${order.table?.name}`
                                      : t("common:labels.takeAway")}{" "}
                                  </ThemedText>
                                  <Button
                                    label="Editar"
                                    variant="text"
                                    size="small"
                                    rightIcon="chevron-forward"
                                    onPress={() =>
                                      handleOpenOrder(order.num, order.id)
                                    }
                                  />
                                </ThemedView>
                                <ThemedView
                                  style={tw`flex-row items-center gap-2 mt-1`}
                                >
                                  <ThemedText
                                    type="small"
                                    style={tw`text-gray-500 font-semibold`}
                                  >
                                    {t("orders:details.orderNumber", {
                                      num: order.num,
                                    })}
                                  </ThemedText>
                                  <ThemedText
                                    type="small"
                                    style={tw`text-gray-500`}
                                  >
                                    •
                                  </ThemedText>
                                  <ThemedText
                                    type="small"
                                    style={tw`text-gray-500 font-semibold`}
                                  >
                                    {relativeTime}
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
      <Popover
        visible={popoverVisible}
        onClose={() => setPopoverVisible(false)}
        anchor={popoverAnchor}
        title={t("orders:views.title")}
        selectedValue={selectedView}
        items={[
          {
            label: t("orders:views.products"),
            value: "pending-products",
            icon: "grid-outline",
            onPress: () => setSelectedView("pending-products"),
          },
          {
            label: t("orders:views.orders"),
            value: "order-lists",
            icon: "list-outline",
            onPress: () => setSelectedView("order-lists"),
          },
        ]}
      />
      <Fab icon="add-outline" onPress={handlePresentModalPress} />
    </ThemedView>
  );
}
