import {
  Modal,
  ScrollView,
  View,
  Pressable,
  RefreshControl,
  Alert,
} from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import Button from "@/presentation/theme/components/button";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import { useOrderStatus } from "@/presentation/orders/hooks/useOrderStatus";
import { OrderDetail } from "@/core/orders/models/order-detail.model";
import OrderDetailCard from "@/presentation/orders/components/order-detail-card";
import { useOrders } from "@/presentation/orders/hooks/useOrders";
import Label from "@/presentation/theme/components/label";
import { useModal } from "@/presentation/shared/hooks/useModal";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import * as Haptics from "expo-haptics";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useQueryClient } from "@tanstack/react-query";
import { useOrder } from "@/presentation/orders/hooks/useOrder";

dayjs.extend(relativeTime);

export default function OrderScreen() {
  const { t } = useTranslation(["common", "orders", "errors"]);
  const navigation = useNavigation();
  const order = useOrdersStore((state) => state.activeOrder);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const setActiveOrderDetail = useOrdersStore(
    (state) => state.setActiveOrderDetail,
  );
  const { mutate: updateOrder, isOnline, isLoading } = useOrders().updateOrder;
  const { mutate: deleteOrder } = useOrders().deleteOrder;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const primaryColor = useThemeColor({}, "primary");

  // Fetch and sync the order data (this enables the query for refetch)
  const {
    isLoading: isLoadingOrder,
    isError: isOrderError,
    isRefetching,
  } = useOrder(order?.id || null);

  // Update header title dynamically with order number
  useEffect(() => {
    if (order) {
      navigation.setOptions({
        title: t("orders:details.orderNumber", { num: order.num }),
      });
    }
  }, [navigation, order?.num, t]);

  const {
    isOpen: closeModalIsOpen,
    handleOpen: openCloseModal,
    handleClose: closeCloseModal,
  } = useModal();

  const [visible, setVisible] = useState(false);
  const [isDeliveredExpanded, setIsDeliveredExpanded] = useState(
    order?.status === OrderStatus.DELIVERED,
  );

  // Call all hooks before any conditional returns
  const { statusText, statusTextColor, statusIcon, statusIconColor, bgColor } =
    useOrderStatus(order?.status || OrderStatus.PENDING);

  const onRefresh = useCallback(async () => {
    if (!order?.id) return;

    try {
      setRefreshing(true);
      // Trigger haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Refetch the specific order
      await queryClient.refetchQueries({
        queryKey: ["order", order.id],
      });
    } catch {
      Alert.alert(
        t("errors:order.fetchError"),
        t("errors:order.ordersFetchFailed"),
      );
    } finally {
      setRefreshing(false);
    }
  }, [order?.id, queryClient, t]);

  // Early return after all hooks have been called
  if (!order) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText type="h2">{t("orders:details.noActiveOrder")}</ThemedText>
      </ThemedView>
    );
  }

  // Show loading state while fetching order details (especially for closed orders)
  if (isLoadingOrder && !order.details) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText type="h2">{t("common:status.loading")}</ThemedText>
      </ThemedView>
    );
  }

  // Check if this is a closed order
  const isClosed = order.isClosed === true;

  // Non-hook functions and computed values can be after the early return
  const openProduct = (detail: OrderDetail) => {
    // Prevent editing if order is closed
    if (isClosed) return;

    setActiveOrderDetail(detail);
    router.push("/(order)/edit-order-detail");
  };

  const date = dayjs(order.createdAt).isSame(dayjs(), "day")
    ? `${t("common:time.today")}, ${dayjs(order.createdAt).format("HH:mm")}`
    : dayjs(order.createdAt).format("dddd, HH:mm");

  const updateStatus = (status: OrderStatus) => {
    updateOrder(
      {
        id: order.id,
        status,
      },
      {
        onSuccess: (resp) => {
          // Handle success if needed
        },
      },
    );
  };

  const onCloseOrder = () => {
    closeCloseModal();
    updateOrder(
      {
        id: order.id,
        isClosed: true,
      },
      {
        onSuccess: (resp) => {
          router.replace("/(tabs)");
          // Handle success if needed
        },
      },
    );
  };

  const closeModal = () => {
    setVisible(false);
  };

  const onRemoveOrder = () => {
    deleteOrder(order.id, {
      onSuccess: () => {
        closeModal();
        setActiveOrder(null);
        router.replace("/(tabs)");
      },
    });
  };

  // Filter order details into pending and delivered
  // Add defensive check for undefined details
  const hasDetails = order.details && Array.isArray(order.details);
  const pendingDetails = hasDetails
    ? order.details.filter((detail) => detail.qtyDelivered < detail.quantity)
    : [];
  const deliveredDetails = hasDetails
    ? order.details.filter((detail) => detail.qtyDelivered === detail.quantity)
    : [];

  // For closed orders, show all items together
  const allDetails = hasDetails ? order.details : [];
  const hasItems = allDetails.length > 0;

  const toggleDeliveredSection = () => {
    setIsDeliveredExpanded(!isDeliveredExpanded);
  };

  return (
    <>
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        {/* Backdrop */}
        <View style={tw`flex-1 bg-black/50 items-center justify-center`}>
          {/* Modal card */}
          <View style={tw`bg-white rounded-2xl w-4/5 p-5 shadow-lg`}>
            <ThemedText type="h4">{t("orders:dialogs.removeTitle")}</ThemedText>
            <ThemedText type="body1" style={tw`mt-2 mb-4`}>
              {t("orders:dialogs.removeMessage")}
            </ThemedText>

            <ThemedView style={tw`flex-row justify-end gap-2`}>
              <Button
                label={t("common:actions.cancel")}
                onPress={closeModal}
                variant="outline"
                size="small"
              />
              <Button
                label={t("common:actions.remove")}
                onPress={onRemoveOrder}
                size="small"
              />
            </ThemedView>
          </View>
        </View>
      </Modal>
      <Modal
        transparent
        visible={closeModalIsOpen}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        {/* Backdrop */}
        <View style={tw`flex-1 bg-black/50 items-center justify-center`}>
          {/* Modal card */}
          <View style={tw`bg-white rounded-2xl w-4/5 p-5 shadow-lg`}>
            <ThemedText type="h3">{t("orders:dialogs.closeTitle")}</ThemedText>
            <ThemedText type="body1" style={tw`mt-2 mb-4`}>
              {t("orders:dialogs.closeMessage")}{" "}
            </ThemedText>

            <ThemedView style={tw`flex-row justify-end gap-2`}>
              <Button
                label={t("common:actions.cancel")}
                onPress={closeCloseModal}
                variant="outline"
                size="small"
              />
              <Button
                label={t("common:actions.close")}
                onPress={onCloseOrder}
                size="small"
              />
            </ThemedView>
          </View>
        </View>
      </Modal>
      <ThemedView style={tw`px-4 pt-6 flex-1`}>
        <ScrollView
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`pb-4`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={primaryColor}
              colors={[primaryColor]}
            />
          }
        >
          {/* Header Section */}
          <ThemedView style={tw`mb-6 gap-4`}>
            {/* Date */}
            <ThemedView style={tw`flex-row items-center gap-2 justify-between`}>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {date}
              </ThemedText>
              <ThemedView style={tw`flex-row items-center gap-1`}>
                <ThemedText type="small">Hora de entrega</ThemedText>
                <ThemedText type="small" style={tw``}>
                  {dayjs(order.deliveryTime).format(" HH:mm")}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            {/* Table/Location & People */}
            <ThemedView style={tw`flex-row items-center gap-2`}>
              <Ionicons
                name={
                  order.type === OrderType.IN_PLACE
                    ? "restaurant-outline"
                    : "bag-outline"
                }
                size={24}
                color={tw.color("primary-600")}
              />
              <ThemedText type="h2">
                {order.type === OrderType.IN_PLACE
                  ? `${t("common:labels.table")} ${order.table?.name}`
                  : t("common:labels.takeAway")}
              </ThemedText>
              <ThemedView style={tw`flex-row items-center gap-1 ml-2`}>
                <Ionicons
                  name="people-outline"
                  size={18}
                  color={tw.color("gray-600")}
                />
                <ThemedText type="body2" style={tw`text-gray-600`}>
                  {order.people}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            {/* Status & Payment Labels */}
            <ThemedView style={tw`flex-row items-center gap-2`}>
              <ThemedView
                style={tw`flex-row items-center gap-1.5 ${bgColor}/10 px-3 py-1.5 rounded-full`}
              >
                <Ionicons
                  name={statusIcon}
                  size={16}
                  color={tw.color(statusIconColor)}
                />
                <ThemedText
                  type="small"
                  style={tw`${statusTextColor} font-semibold`}
                >
                  {statusText}
                </ThemedText>
              </ThemedView>
              {order.isPaid ? (
                <Label text={t("orders:details.paid")} color="success" />
              ) : (
                <Label text={t("orders:details.unpaid")} color="warning" />
              )}
              {isClosed && (
                <ThemedView
                  style={tw`flex-row items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full`}
                >
                  <Ionicons
                    name="archive-outline"
                    size={16}
                    color={tw.color("gray-600")}
                  />
                  <ThemedText
                    type="small"
                    style={tw`text-gray-700 font-semibold`}
                  >
                    {t("orders:details.closedOrder")}
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>

            {/* Waiter Info */}
            <ThemedView
              style={tw`flex-row items-center gap-2 pt-2 border-t border-gray-200`}
            >
              <Ionicons
                name="person-outline"
                size={16}
                color={tw.color("gray-500")}
              />
              <ThemedText type="body2" style={tw`text-gray-600`}>
                {order.user.person.firstName} {order.user.person.lastName}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Notes Section */}
          {order.notes && (
            <ThemedView style={tw`mb-6 p-4 bg-gray-50 rounded-xl`}>
              <ThemedView style={tw`flex-row items-center gap-2 mb-2`}>
                <Ionicons
                  name="document-text-outline"
                  size={16}
                  color={tw.color("gray-500")}
                />
                <ThemedText
                  type="caption"
                  style={tw`text-gray-500 font-semibold`}
                >
                  {t("common:labels.notes")}
                </ThemedText>
              </ThemedView>
              <ThemedText type="body2" style={tw`text-gray-700`}>
                {order.notes}
              </ThemedText>
            </ThemedView>
          )}

          {/* Pending Items Section */}
          {!isClosed && pendingDetails.length > 0 && (
            <ThemedView style={tw`mb-6`}>
              <ThemedView
                style={tw`flex-row justify-between items-center mb-4`}
              >
                <ThemedText type="h4">
                  {t("orders:details.pendingItems")}
                </ThemedText>
                <ThemedView style={tw`bg-primary-50 px-2.5 py-1 rounded-full`}>
                  <ThemedText
                    type="small"
                    style={tw`text-primary-700 font-semibold`}
                  >
                    {pendingDetails.length}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              <ThemedView style={tw`gap-6`}>
                {pendingDetails.map((detail) => (
                  <OrderDetailCard
                    key={detail.id}
                    detail={detail}
                    onPress={() => openProduct(detail)}
                  />
                ))}
              </ThemedView>
            </ThemedView>
          )}

          {/* Delivered Items Section - Expandable (for active orders) */}
          {!isClosed && deliveredDetails.length > 0 && (
            <ThemedView style={tw`mb-6`}>
              <Pressable onPress={toggleDeliveredSection}>
                <ThemedView
                  style={tw`flex-row justify-between items-center py-3 px-1`}
                >
                  <ThemedView style={tw`flex-row items-center gap-2`}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color={tw.color("gray-400")}
                    />
                    <ThemedText type="h4" style={tw`text-gray-600`}>
                      {t("orders:details.deliveredItems")}
                    </ThemedText>
                    <ThemedView
                      style={tw`bg-gray-100 px-2 py-0.5 rounded-full`}
                    >
                      <ThemedText type="caption" style={tw`text-gray-600`}>
                        {deliveredDetails.length}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <Ionicons
                    name={
                      isDeliveredExpanded
                        ? "chevron-up-outline"
                        : "chevron-down-outline"
                    }
                    size={20}
                    color={tw.color("gray-400")}
                  />
                </ThemedView>
              </Pressable>

              {isDeliveredExpanded && (
                <ThemedView style={tw`gap-3 mt-2 opacity-60`}>
                  {deliveredDetails.map((detail) => (
                    <OrderDetailCard
                      key={detail.id}
                      detail={detail}
                      onPress={() => openProduct(detail)}
                    />
                  ))}
                </ThemedView>
              )}
            </ThemedView>
          )}

          {/* All Items Section - For closed orders */}
          {isClosed && hasItems && (
            <ThemedView style={tw`mb-6`}>
              <ThemedView
                style={tw`flex-row justify-between items-center mb-4`}
              >
                <ThemedText type="h4">
                  {t("orders:details.allItems")}
                </ThemedText>
                <ThemedView style={tw`bg-gray-100 px-2.5 py-1 rounded-full`}>
                  <ThemedText
                    type="small"
                    style={tw`text-gray-700 font-semibold`}
                  >
                    {allDetails.length}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              <ThemedView style={tw`gap-6`}>
                {allDetails.map((detail) => (
                  <OrderDetailCard
                    key={detail.id}
                    detail={detail}
                    onPress={() => {}} // No action for closed orders
                  />
                ))}
              </ThemedView>
            </ThemedView>
          )}

          {/* Empty state for closed orders with no items */}
          {isClosed && !hasItems && (
            <ThemedView style={tw`mb-6 p-8 items-center justify-center`}>
              <Ionicons
                name="document-outline"
                size={48}
                color={tw.color("gray-300")}
              />
              <ThemedText
                type="body1"
                style={tw`text-gray-500 mt-4 text-center`}
              >
                {t("orders:details.noItemsInOrder")}
              </ThemedText>
            </ThemedView>
          )}

          {/* Add Product Button - Only for active orders */}
          {!isClosed && (
            <Button
              leftIcon="add-outline"
              label={t("orders:details.addProduct")}
              variant="outline"
              onPress={() => router.push("/restaurant-menu")}
            />
          )}
        </ScrollView>
      </ThemedView>

      {/* Footer - Total */}
      <ThemedView style={tw`px-4 py-4 border-t border-gray-200 bg-white`}>
        <ThemedView style={tw`flex-row justify-between items-center`}>
          <ThemedText type="h4" style={tw`text-gray-600`}>
            {t("common:labels.total")}
          </ThemedText>
          <ThemedText type="h2" style={tw`text-primary-700`}>
            {formatCurrency(order.total)}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </>
  );
}
