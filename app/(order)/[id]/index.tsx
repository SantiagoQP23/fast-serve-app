import {
  Modal,
  ScrollView,
  View,
  Pressable,
  RefreshControl,
  Alert,
  Platform,
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
import IconButton from "@/presentation/theme/components/icon-button";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { useOrderPaymentStatus } from "@/presentation/orders/hooks/useOrderPaymentStatus";
import { OrderPaymentStatus } from "@/core/orders/enums/order-payment-status.enum";
import Chip from "@/presentation/theme/components/chip";
import DateTimePicker from "@react-native-community/datetimepicker";

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
  const { paymentStatus } = useOrderPaymentStatus(
    order?.paymentStatus || OrderPaymentStatus.UNPAID,
  );

  // Update header title dynamically with order number
  useEffect(() => {
    if (order) {
      // navigation.setOptions({
      //   title: t("orders:details.orderNumber", { num: order.num }),
      // });
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
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Call all hooks before any conditional returns
  const {
    statusText,
    labelColor,
    statusTextColor,
    statusIcon,
    statusIconColor,
    bgColor,
  } = useOrderStatus(order?.status || OrderStatus.PENDING);

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
    router.push(`/(order)/${order.num}/edit-order-detail`);
  };

  const createdAt = dayjs(order.createdAt);
  const updatedAt = dayjs(order.updatedAt);
  const deliveryTime = order.deliveryTime ? dayjs(order.deliveryTime) : null;
  const date = createdAt.isSame(dayjs(), "day")
    ? `${t("common:time.today")}, ${createdAt.format("HH:mm")}`
    : createdAt.format("dddd, HH:mm");
  const showDeliveryTime =
    deliveryTime !== null && !deliveryTime.isSame(createdAt, "minute");
  const createdAtLabel = `${createdAt.fromNow()} · ${createdAt.format(
    "MMM D, HH:mm",
  )}`;
  const updatedAtLabel = `${updatedAt.fromNow()} · ${updatedAt.format(
    "MMM D, HH:mm",
  )}`;

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
          // router.replace("/(app)/(tabs)/(orders-module)/my-orders");
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
        router.replace("/(app)/(tabs)/(orders-module)/my-orders");
      },
    });
  };

  const handleCloseOrder = () => {
    openCloseModal();
  };

  const openTimePicker = () => setShowTimePicker(true);
  const closeTimePicker = () => setShowTimePicker(false);

  const handleTimeChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }

    if (!selectedDate) return;

    const baseTime = deliveryTime ?? createdAt;
    const nextTime = dayjs(selectedDate);
    const merged = baseTime
      .hour(nextTime.hour())
      .minute(nextTime.minute())
      .second(0)
      .millisecond(0);

    updateOrder(
      {
        id: order.id,
        deliveryTime: merged.toDate(),
      },
      {
        onSuccess: () => {
          if (Platform.OS === "ios") closeTimePicker();
        },
      },
    );
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
      <ScreenLayout style={tw`px-4 pt-6 flex-1`}>
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
            {showDeliveryTime && showTimePicker && deliveryTime && (
              <ThemedView style={tw`mt-3`}>
                {Platform.OS === "ios" && (
                  <ThemedView
                    style={tw`border border-gray-300 rounded-2xl overflow-hidden`}
                  >
                    <DateTimePicker
                      value={deliveryTime.toDate()}
                      mode="time"
                      display="spinner"
                      onChange={handleTimeChange}
                    />
                    <Button
                      label={t("common:actions.confirm")}
                      onPress={closeTimePicker}
                      variant="primary"
                      size="small"
                    />
                  </ThemedView>
                )}
                {Platform.OS === "android" && (
                  <DateTimePicker
                    value={deliveryTime.toDate()}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={handleTimeChange}
                  />
                )}
              </ThemedView>
            )}

            {/* Table/Location & People */}
            <ThemedView style={tw`gap-2`}>
              <ThemedText type="body2" style={tw`text-gray-500`}>
                {t("orders:details.orderNumber", { num: order.num })}
              </ThemedText>
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
                <ThemedText type="h2" style={tw` font-bold`}>
                  {order.type === OrderType.IN_PLACE
                    ? `${t("common:labels.table")} ${order.table?.name}`
                    : t("common:labels.takeAway")}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            {/* Status & Payment Labels */}
            <ThemedView
              style={tw`flex-row items-center gap-2 flex-wrap p-2 bg-gray-100 rounded-xl`}
            >
              {showDeliveryTime && deliveryTime && (
                <Label
                  leftIcon="hourglass-outline"
                  text={deliveryTime.format("HH:mm")}
                  size="small"
                  color="outline"
                  onPress={openTimePicker}
                />
              )}
              <Label
                text={String(order.people)}
                leftIcon="people-outline"
                size="small"
                color="outline"
              />
              <Label
                text={statusText}
                color={labelColor}
                leftIcon={statusIcon}
                size="small"
              />

              <Label
                text={paymentStatus.text}
                color={paymentStatus.color}
                size="small"
              />
              {isClosed && (
                <Label
                  text={
                    isClosed
                      ? t("orders:details.closedOrder")
                      : t("orders:details.open")
                  }
                  color={isClosed ? "default" : "success"}
                  size="small"
                />
              )}

              <Label
                leftIcon="person-outline"
                text={`${order.user.person.firstName} ${order.user.person.lastName}`}
                size="small"
                color="outline"
              />
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
                <ThemedText type="body2" style={tw`text-gray-500`}>
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
                    orderUserId={order.user.id}
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
                  style={tw`flex-row justify-between items-center py-3`}
                >
                  <ThemedView style={tw`flex-row items-center gap-2`}>
                    <ThemedText type="body2" style={tw`text-gray-500`}>
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
                      orderUserId={order.user.id}
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
                    orderUserId={order.user.id}
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
              onPress={() => router.push("/(new-order)/restaurant-menu")}
            />
          )}

          <ThemedView style={tw`mt-4 mb-6`} />

          <ThemedView>
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("orders:details.actions")}
            </ThemedText>
            <ThemedView style={tw`flex-row gap-4 mt-3`}>
              <ThemedView style={tw`gap-2 items-center`}>
                <Pressable
                  style={tw`flex items-center gap-2 p-4 bg-gray-100 rounded-lg min-w-15 w-20`}
                  onPress={() => router.push(`/(order)/${order.id}/bills`)}
                >
                  <Ionicons name={"cash-outline"} size={30} style={tw``} />
                </Pressable>

                <ThemedText type="body2">
                  {t("orders:details.payments")}
                </ThemedText>
              </ThemedView>
              {order.status === OrderStatus.DELIVERED &&
                order.isClosed === false &&
                order.isPaid === true && (
                  <ThemedView style={tw`gap-2 items-center`}>
                    <Pressable
                      style={tw`flex items-center gap-2 p-4 bg-gray-100 rounded-lg min-w-15 w-20`}
                      onPress={handleCloseOrder}
                    >
                      <Ionicons
                        name={"lock-closed-outline"}
                        size={30}
                        style={tw``}
                      />
                    </Pressable>

                    <ThemedText type="body2">
                      {t("orders:options.closeOrder")}
                    </ThemedText>
                  </ThemedView>
                )}
            </ThemedView>
          </ThemedView>

          <ThemedView style={tw`my-10`}>
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("orders:details.activity")}
            </ThemedText>
            <ThemedView style={tw`mt-3 gap-2`}>
              <ThemedView style={tw`flex-row items-center gap-2`}>
                <Ionicons
                  name="ellipse-outline"
                  size={12}
                  color={tw.color("gray-500")}
                />
                <ThemedText type="body2" style={tw`text-gray-600`}>
                  {t("orders:details.createdAt")}
                </ThemedText>
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {createdAtLabel}
                </ThemedText>
              </ThemedView>
              <ThemedView style={tw`flex-row items-center gap-2`}>
                <Ionicons
                  name="ellipse-outline"
                  size={12}
                  color={tw.color("gray-500")}
                />
                <ThemedText type="body2" style={tw`text-gray-600`}>
                  {t("orders:details.updatedAt")}
                </ThemedText>
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {updatedAtLabel}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </ScrollView>
        {/* divider */}
      </ScreenLayout>

      {/* Footer - Total */}
      <ThemedView style={tw`px-4 py-4 border-t border-gray-200 bg-white`}>
        <ThemedView style={tw`flex-row justify-between items-center`}>
          <ThemedText type="h4" style={tw`text-gray-600`}>
            {t("common:labels.total")}
          </ThemedText>
          <ThemedText type="h2" style={tw`font-bold`}>
            {formatCurrency(order.total)}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </>
  );
}
