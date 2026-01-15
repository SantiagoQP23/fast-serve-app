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
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";
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
import { formatCurrency, getRelativeDate } from "@/core/i18n/utils";
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
  useOrder(order?.id || null);

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
  const [isDeliveredExpanded, setIsDeliveredExpanded] = useState(false);

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

  // Non-hook functions and computed values can be after the early return
  const openProduct = (detail: OrderDetail) => {
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
  const pendingDetails = order.details.filter(
    (detail) => detail.qtyDelivered < detail.quantity,
  );
  const deliveredDetails = order.details.filter(
    (detail) => detail.qtyDelivered === detail.quantity,
  );

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
      <ThemedView style={tw`px-4 pt-8 flex-1 gap-4`}>
        <ScrollView
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`gap-4 pb-4`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={primaryColor}
              colors={[primaryColor]}
            />
          }
        >
          <ThemedView style={tw` justify-between gap-4 mb-4`}>
            <ThemedView
              style={tw`gap-1 bg-transparent flex-row justify-between`}
            >
              <ThemedView style={tw`gap-3 bg-transparent`}>
                <ThemedView style={tw`gap-2 bg-transparent`}>
                  <ThemedText type="body2" style={tw`text-gray-500`}>
                    {date}
                  </ThemedText>
                </ThemedView>
                <ThemedView
                  style={tw` flex-row  bg-transparent items-center gap-2`}
                >
                  <ThemedText type="h2">
                    {order.type === OrderType.IN_PLACE
                      ? `${t("common:labels.table")} ${order.table?.name}`
                      : t("common:labels.takeAway")}{" "}
                  </ThemedText>
                  <ThemedText type="body2" style={tw`text-gray-500`}>
                    •
                  </ThemedText>
                  <Ionicons name="people-outline" size={18} />
                  <ThemedText type="body2">{order.people}</ThemedText>
                </ThemedView>
                <ThemedView
                  style={tw` flex-row  bg-transparent items-center gap-2`}
                >
                  <ThemedView
                    style={tw`gap-1 flex-row items-center ${bgColor}/10 px-3 py-1 rounded-full`}
                  >
                    <Ionicons
                      name={statusIcon}
                      size={18}
                      color={tw.color(statusIconColor)}
                    />
                    <ThemedText
                      type="body2"
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
                </ThemedView>
              </ThemedView>

              {/* <ThemedView */}
              {/*   style={tw`flex-row items-center bg-transparent gap-2`} */}
              {/* > */}
              {/*   {order.isPaid ? ( */}
              {/*     <Label text={t("orders:details.paid")} color="success" /> */}
              {/*   ) : ( */}
              {/*     <Label text={t("orders:details.unpaid")} color="warning" /> */}
              {/*   )} */}
              {/*   <ThemedView */}
              {/*     style={tw`gap-1 flex-row items-center ${bgColor}/10 px-3 py-1 rounded-full`} */}
              {/*   > */}
              {/*     <Ionicons */}
              {/*       name={statusIcon} */}
              {/*       size={18} */}
              {/*       color={tw.color(statusIconColor)} */}
              {/*     /> */}
              {/*     <ThemedText */}
              {/*       type="body2" */}
              {/*       style={tw`${statusTextColor} font-semibold`} */}
              {/*     > */}
              {/*       {statusText} */}
              {/*     </ThemedText> */}
              {/*   </ThemedView> */}
              {/* </ThemedView> */}
            </ThemedView>
            {/* <ThemedView style={tw`border-t border-dashed border-gray-700`} /> */}
            <ThemedView style={tw`gap-2 flex-row items-center bg-transparent`}>
              <Ionicons name="person-outline" size={16} />
              {/* <ThemedText type="body2" style={tw`font-semibold`}> */}
              {/*   Waiter: */}
              {/* </ThemedText> */}
              <ThemedText type="body2">
                {order.user.person.firstName} {order.user.person.lastName}
              </ThemedText>
            </ThemedView>
          </ThemedView>
          {order.notes && (
            <ThemedView style={tw`gap-2`}>
              <ThemedText type="caption">{t("common:labels.notes")}</ThemedText>
              <ThemedText type="body2">{order.notes}</ThemedText>
            </ThemedView>
          )}
          {/* <View style={tw`flex-row gap-4`}> */}
          {/*   <Button */}
          {/*     label="Start" */}
          {/*     icon="play-outline" */}
          {/*     layout="vertical" */}
          {/*     variant="secondary" */}
          {/*   /> */}
          {/*   <Button */}
          {/*     label="Tables" */}
          {/*     icon="grid-outline" */}
          {/*     layout="vertical" */}
          {/*     variant="secondary" */}
          {/*   /> */}
          {/*   <Button */}
          {/*     label="Menu" */}
          {/*     icon="restaurant-outline" */}
          {/*     layout="vertical" */}
          {/*     variant="outline" */}
          {/*   /> */}
          {/* </View> */}
          {/* {order.status !== OrderStatus.DELIVERED && ( */}
          {/*   <ThemedView style={tw`flex-row justify-between items-center`}> */}
          {/*     {order.status === OrderStatus.IN_PROGRESS && ( */}
          {/*       <Button */}
          {/*         label="Pause" */}
          {/*         variant="outline" */}
          {/*         rightIcon="pause-outline" */}
          {/*         size="small" */}
          {/*         onPress={() => updateStatus(OrderStatus.PENDING)} */}
          {/*       /> */}
          {/*     )} */}
          {/*     <ThemedView style={tw`flex-row items-center gap-2`}></ThemedView> */}
          {/*     {order.status === OrderStatus.IN_PROGRESS && ( */}
          {/*       <Button */}
          {/*         label="Deliver" */}
          {/*         variant="outline" */}
          {/*         rightIcon="checkmark-done-outline" */}
          {/*         size="small" */}
          {/*         onPress={() => updateStatus(OrderStatus.DELIVERED)} */}
          {/*       /> */}
          {/*     )} */}
          {/*     {order.status === OrderStatus.PENDING && ( */}
          {/*       <Button */}
          {/*         label="Start" */}
          {/*         variant="outline" */}
          {/*         rightIcon="play-outline" */}
          {/*         size="small" */}
          {/*         onPress={() => updateStatus(OrderStatus.IN_PROGRESS)} */}
          {/*       /> */}
          {/*     )} */}
          {/*   </ThemedView> */}
          {/* )} */}

          {/* Pending Items Section */}
          {pendingDetails.length > 0 && (
            <ThemedView style={tw`gap-4  rounded-lg`}>
              <ThemedView style={tw`flex-row justify-between items-center`}>
                <ThemedText type="h4">
                  {t("orders:details.pendingItems")}
                </ThemedText>
                <ThemedText type="small">
                  {t("common:labels.count")}: {pendingDetails.length}
                </ThemedText>
              </ThemedView>
              <ThemedView style={tw`gap-8`}>
                {pendingDetails.map((detail, index) => (
                  <OrderDetailCard
                    key={detail.id}
                    detail={detail}
                    onPress={() => openProduct(detail)}
                  />
                ))}
              </ThemedView>
            </ThemedView>
          )}

          {/* Delivered Items Section - Expandable */}
          {deliveredDetails.length > 0 && (
            <ThemedView style={tw`gap-4`}>
              <Pressable onPress={toggleDeliveredSection}>
                <ThemedView
                  style={tw`flex-row justify-between items-center py-3`}
                >
                  <ThemedView style={tw`flex-row items-center gap-2`}>
                    <ThemedText type="h4">
                      {t("orders:details.deliveredItems")}
                    </ThemedText>
                    <ThemedText type="small">
                      ({deliveredDetails.length})
                    </ThemedText>
                  </ThemedView>
                  <Ionicons
                    name={
                      isDeliveredExpanded
                        ? "chevron-up-outline"
                        : "chevron-down-outline"
                    }
                    size={20}
                  />
                </ThemedView>
              </Pressable>

              {isDeliveredExpanded && (
                <ThemedView style={tw`gap-8 opacity-60`}>
                  {deliveredDetails.map((detail, index) => (
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

          <Button
            leftIcon="add-outline"
            label={t("orders:details.addProduct")}
            variant="outline"
            onPress={() => router.push("/restaurant-menu")}
          />
        </ScrollView>
      </ThemedView>
      <ThemedView style={tw`gap-4 p-4 rounded-lg `}>
        <ThemedView style={tw`flex-row justify-between items-center`}>
          <ThemedText type="h3">{t("common:labels.total")}</ThemedText>
          <ThemedText type="h2">{formatCurrency(order.total)}</ThemedText>
        </ThemedView>
        {/* <ThemedView style={tw`flex-row justify-between items-center`}> */}
        {/*   <ThemedView style={tw`flex-row items-center gap-2`}> */}
        {/*     {order.status === OrderStatus.DELIVERED && order.isPaid && ( */}
        {/*       <Button */}
        {/*         label="Close" */}
        {/*         variant="secondary" */}
        {/*         onPress={openCloseModal} */}
        {/*         leftIcon="lock-closed-outline" */}
        {/*       ></Button> */}
        {/*     )} */}
        {/*   </ThemedView> */}
        {/*   <Button */}
        {/*     label="Payments" */}
        {/*     variant="secondary" */}
        {/*     onPress={() => router.push(`/(order)/${order.id}/bills`)} */}
        {/*     rightIcon="arrow-forward-outline" */}
        {/*   ></Button> */}
        {/* </ThemedView> */}
      </ThemedView>
    </>
  );
}
