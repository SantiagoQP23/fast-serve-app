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
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useNavigation } from "expo-router";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import Button from "@/presentation/theme/components/button";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import { useOrderStatus } from "@/presentation/orders/hooks/useOrderStatus";
import {
  OrderDetail,
  OrderDetailStatus,
} from "@/core/orders/models/order-detail.model";
import OrderDetailCard from "@/presentation/orders/components/order-detail-card";
import { useOrders } from "@/presentation/orders/hooks/useOrders";
import Label from "@/presentation/theme/components/label";
import { useModal } from "@/presentation/shared/hooks/useModal";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency, i18nAlert } from "@/core/i18n/utils";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import * as Haptics from "expo-haptics";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useQueryClient } from "@tanstack/react-query";
import { useOrder } from "@/presentation/orders/hooks/useOrder";
import OrderElapsedTimeLabel from "@/presentation/orders/components/order-elapsed-time-label";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { useOrderPaymentStatus } from "@/presentation/orders/hooks/useOrderPaymentStatus";
import { OrderPaymentStatus } from "@/core/orders/enums/order-payment-status.enum";
import { useOrderPrint } from "@/presentation/orders/hooks/useOrderPrint";
import FloatingToolbar from "@/presentation/theme/components/floating-toolbar";
import EditOrderBottomSheet from "@/presentation/orders/components/edit-order-bottom-sheet";
import ReassignOrderBottomSheet, {
  type ReassignOrderBottomSheetRef,
} from "@/presentation/orders/components/reassign-order-bottom-sheet";
import EditPeopleBottomSheet from "@/presentation/orders/components/edit-people-bottom-sheet";
import TableSelectorBottomSheet, {
  type TableSelectorBottomSheetRef,
} from "@/presentation/orders/components/table-selector-bottom-sheet";
import EditNoteBottomSheet from "@/presentation/orders/components/edit-note-bottom-sheet";
import { Order } from "@/core/orders/models/order.model";
import MergeOrderBottomSheet, {
  type MergeOrderBottomSheetRef,
} from "@/presentation/orders/components/merge-order-bottom-sheet";
import CloseOrderModal from "@/presentation/orders/components/close-order-modal";

import DateTimePicker from "@react-native-community/datetimepicker";
import { useEditOrderCartStore } from "@/presentation/orders/store/editOrderCartStore";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { useMarkOrderDelivered } from "@/presentation/orders/hooks/useMarkOrderDelivered";
import IconButton from "@/presentation/theme/components/icon-button";
import { useBills } from "@/presentation/orders/hooks/useBills";
import ActionsBottomSheet from "@/presentation/theme/components/actions-bottom-sheet";
import OrderBillsTab from "@/presentation/orders/components/order-bills-tab";
import OrderTicketsTab from "@/presentation/orders/components/order-tickets-tab";
import { typography } from "@/constants/theme";
import Chip from "@/presentation/theme/components/chip";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import OrderSyncLabel from "@/presentation/offline/components/order-sync-label";
import { orderNumberText } from "@/presentation/offline/local-order";

dayjs.extend(relativeTime);

interface MoreOptionItem {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

interface OrderDetailViewProps {
  /**
   * Rendered as a pane next to the orders list (tablet) instead of as its own
   * screen: header actions render inline and leaving the order clears the
   * pane instead of navigating.
   */
  embedded?: boolean;
}

export default function OrderDetailView({
  embedded = false,
}: OrderDetailViewProps) {
  const { t } = useTranslation(["common", "orders", "errors"]);
  const navigation = useNavigation();
  const order = useOrdersStore((state) => state.activeOrder);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const setActiveOrderDetail = useOrdersStore(
    (state) => state.setActiveOrderDetail,
  );

  const init = useEditOrderCartStore((state) => state.init);
  const { mutate: updateOrder, isOnline, isLoading } = useOrders().updateOrder;
  const { mutate: deleteOrder } = useOrders().deleteOrder;
  const { mutate: mergeOrder } = useOrders().mergeOrder;
  const hasOtherOpenOrders = useOrdersStore((state) =>
    state.orders.some((o) => o.id !== order?.id && !o.isClosed),
  );
  const { markDelivered } = useMarkOrderDelivered();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const primaryColor = useThemeColor({}, "primary");
  const { user } = useAuthStore();
  const isAdmin = isAdminLevelRole(user?.role?.name);

  // Fetch and sync the order data (this enables the query for refetch)
  const {
    isLoading: isLoadingOrder,
    isError: isOrderError,
    isRefetching,
  } = useOrder(order?.id || null);
  const { paymentStatus } = useOrderPaymentStatus(
    order?.paymentStatus || OrderPaymentStatus.UNPAID,
  );
  const { data: orderBills } = useBills().billsByOrderQuery(order?.id || "");

  const {
    isOpen: closeModalIsOpen,
    handleOpen: openCloseModal,
    handleClose: closeCloseModal,
  } = useModal();

  const [visible, setVisible] = useState(false);
  const [isDeliveredExpanded, setIsDeliveredExpanded] = useState(
    order?.status === OrderStatus.DELIVERED,
  );
  const [isCancelledExpanded, setIsCancelledExpanded] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerValue, setPickerValue] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<"products" | "bills" | "tickets">(
    "products",
  );
  const [mergeTarget, setMergeTarget] = useState<Order | null>(null);
  const [mergeDialogVisible, setMergeDialogVisible] = useState(false);
  const [selectionRequested, setSelectionRequested] = useState(false);
  const [selectedDetailIds, setSelectedDetailIds] = useState<Set<string>>(
    new Set(),
  );
  // Call all hooks before any conditional returns
  const {
    statusText,
    labelColor,
    statusTextColor,
    statusIcon,
    statusIconColor,
    bgColor,
  } = useOrderStatus(order?.status || OrderStatus.PENDING);
  const { handleShareOrder } = useOrderPrint(order);

  const editBottomSheetRef = useRef<BottomSheetMethods>(null);
  const reassignBottomSheetRef = useRef<ReassignOrderBottomSheetRef>(null);
  const editPeopleBottomSheetRef = useRef<BottomSheetMethods>(null);
  const tableSelectorBottomSheetRef = useRef<TableSelectorBottomSheetRef>(null);
  const mergeOrderBottomSheetRef = useRef<MergeOrderBottomSheetRef>(null);
  const editNoteBottomSheetRef = useRef<BottomSheetMethods>(null);
  const moreOptionsSheetRef = useRef<BottomSheetMethods>(null);

  const closeEditBottomSheet = () => {
    editBottomSheetRef.current?.close();
  };

  const handlePresentEditModal = useCallback(() => {
    editBottomSheetRef.current?.present();
  }, []);

  const handlePresentReassignModal = useCallback(() => {
    reassignBottomSheetRef.current?.present();
  }, []);

  const closeEditPeopleBottomSheet = () => {
    editPeopleBottomSheetRef.current?.close();
  };

  const handlePresentEditPeopleModal = useCallback(() => {
    editPeopleBottomSheetRef.current?.present();
  }, []);

  const handlePresentTableSelector = useCallback(() => {
    tableSelectorBottomSheetRef.current?.present();
  }, []);

  const closeEditNoteBottomSheet = () => {
    editNoteBottomSheetRef.current?.close();
  };

  const handlePresentEditNoteModal = useCallback(() => {
    editNoteBottomSheetRef.current?.present();
  }, []);

  const handleOpenMoreOptions = useCallback(() => {
    moreOptionsSheetRef.current?.present();
  }, []);

  const canMarkDelivered =
    order?.isClosed !== true &&
    order?.status !== OrderStatus.DELIVERED &&
    (order?.details ?? []).some(
      (detail) =>
        detail.status !== OrderDetailStatus.DELIVERED &&
        detail.status !== OrderDetailStatus.CANCELLED,
    );
  const hasPendingDetails = (order?.details ?? []).some(
    (detail) =>
      detail.status === OrderDetailStatus.PENDING ||
      detail.status === OrderDetailStatus.IN_PROGRESS ||
      detail.status === OrderDetailStatus.READY,
  );
  const canSelectDetails =
    order?.isClosed !== true && hasPendingDetails && activeTab === "products";

  // Selection mode ends on its own once there's nothing left to select
  // (everything got delivered or the order was closed).
  const isSelectionMode = selectionRequested && canSelectDetails;

  const canCloseOrder =
    order?.isClosed !== true &&
    order?.status === OrderStatus.DELIVERED &&
    order?.isPaid === true;

  const Container = embedded ? ThemedView : ScreenLayout;

  const renderHeaderActions = () => (
    <ThemedView style={tw`flex-row items-center gap-2 bg-transparent`}>
      {canMarkDelivered && !isSelectionMode && (
        <Button
          leftIcon="check-check"
          label={t("orders:options.markDelivered")}
          onPress={() => order && markDelivered(order)}
          variant="outline"
          size="extra-small"
        />
      )}
      {canCloseOrder && (
        <Button
          leftIcon="lock"
          label={t("orders:options.closeOrder")}
          onPress={openCloseModal}
          variant="outline"
          size="extra-small"
        />
      )}
      <IconButton
        icon="ellipsis-vertical"
        onPress={handleOpenMoreOptions}
        size={24}
      />
    </ThemedView>
  );

  useEffect(() => {
    // Embedded in another screen: actions render inline in the pane header
    if (embedded) return;

    navigation.setOptions({
      headerRight: renderHeaderActions,
    });
    // renderHeaderActions is rebuilt every render; the values it reads are
    // listed below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    embedded,
    navigation,
    canMarkDelivered,
    isSelectionMode,
    canCloseOrder,
    order,
    markDelivered,
    openCloseModal,
    handleOpenMoreOptions,
    t,
  ]);

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

  const orderCantBeDeleted =
    order.status !== OrderStatus.PENDING ||
    (order.details ?? []).some((detail) => detail.qtyDelivered !== 0);

  const canForceCloseOrder =
    isAdmin &&
    !isClosed &&
    order.status === OrderStatus.DELIVERED &&
    order.isPaid === false;

  const orderAmountInBills: number = orderBills
    ? orderBills
        .map((bill) => bill.total + bill.discount)
        .reduce((acc, curr) => acc + (curr ?? 0), 0)
    : 0;
  const remainingAmount = Math.max(order.total - orderAmountInBills, 0);

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

  const closeModal = () => {
    setVisible(false);
  };

  const onRemoveOrder = () => {
    deleteOrder(order.id, {
      onSuccess: () => {
        closeModal();
        setActiveOrder(null);
        // Embedded: clearing the active order already empties the pane
        if (!embedded) {
          router.replace("/(app)/(tabs)/(orders-module)/my-orders");
        }
      },
    });
  };

  const handleCloseOrder = () => {
    openCloseModal();
  };

  const openTimePicker = () => {
    setPickerValue((deliveryTime ?? createdAt).toDate());
    setShowTimePicker(true);
  };
  const closeTimePicker = () => setShowTimePicker(false);

  const commitDeliveryTime = (selectedDate: Date) => {
    const baseTime = deliveryTime ?? createdAt;
    const nextTime = dayjs(selectedDate);
    const merged = baseTime
      .hour(nextTime.hour())
      .minute(nextTime.minute())
      .second(0)
      .millisecond(0);

    if (deliveryTime && merged.isSame(deliveryTime, "minute")) return;

    updateOrder({
      id: order.id,
      deliveryTime: merged.toDate(),
    });
  };

  // On iOS the spinner stays inline and fires onChange continuously as the
  // user scrolls, so we only track the selection locally and commit it to
  // the server once they press "Confirm" — committing (and closing) on every
  // tick made the picker snap shut after the first notch, before the user
  // could finish choosing a time. Android's native dialog is a single-shot
  // pick, so it commits and closes immediately.
  const handleTimeChange = (_: any, selectedDate?: Date) => {
    if (!selectedDate) return;

    setPickerValue(selectedDate);

    if (Platform.OS === "android") {
      setShowTimePicker(false);
      commitDeliveryTime(selectedDate);
    }
  };

  const handleConfirmTime = () => {
    if (pickerValue) commitDeliveryTime(pickerValue);
    closeTimePicker();
  };

  // Filter order details into pending and delivered
  // Add defensive check for undefined details
  const hasDetails = order.details && Array.isArray(order.details);

  const pendingDetails = hasDetails
    ? order.details.filter(
        (detail) =>
          detail.status === OrderDetailStatus.PENDING ||
          detail.status === OrderDetailStatus.IN_PROGRESS ||
          detail.status === OrderDetailStatus.READY,
      )
    : [];

  const deliveredDetails = hasDetails
    ? order.details.filter((detail) => detail.qtyDelivered === detail.quantity)
    : [];

  const cancelledDetails = hasDetails
    ? order.details.filter(
        (detail) => detail.status === OrderDetailStatus.CANCELLED,
      )
    : [];

  // For closed orders, show all items together
  const allDetails = hasDetails ? order.details : [];
  const hasItems = allDetails.length > 0;

  // Details delivered or removed elsewhere drop out of the pending list, so
  // only count the selected ones that are still pending.
  const selectedDetails = pendingDetails.filter((detail) =>
    selectedDetailIds.has(detail.id),
  );
  const allDetailsSelected =
    pendingDetails.length > 0 &&
    selectedDetails.length === pendingDetails.length;

  const enterSelectionMode = (detail: OrderDetail) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectionRequested(true);
    setSelectedDetailIds(new Set([detail.id]));
  };

  const cancelSelectionMode = () => {
    setSelectionRequested(false);
    setSelectedDetailIds(new Set());
  };

  const toggleSelectDetail = (detail: OrderDetail) => {
    setSelectedDetailIds((current) => {
      const next = new Set(current);
      if (next.has(detail.id)) {
        next.delete(detail.id);
      } else {
        next.add(detail.id);
      }
      return next;
    });
  };

  const toggleSelectAllDetails = () => {
    setSelectedDetailIds(
      allDetailsSelected
        ? new Set()
        : new Set(pendingDetails.map((detail) => detail.id)),
    );
  };

  const deliverSelected = () => {
    if (selectedDetails.length === 0) return;
    markDelivered(order, selectedDetails);
    cancelSelectionMode();
  };

  const toggleDeliveredSection = () => {
    setIsDeliveredExpanded(!isDeliveredExpanded);
  };

  const toggleCancelledSection = () => {
    setIsCancelledExpanded(!isCancelledExpanded);
  };

  const handleAddProduct = () => {
    init(order); // Initialize the edit order cart store with the current order

    router.push("/(new-order)/restaurant-menu");
  };

  const handleAddBill = () => {
    router.push(`/(order)/${order.id}/bills/new`);
  };

  const handleEditFromMenu = () => {
    moreOptionsSheetRef.current?.dismiss();
    handlePresentEditModal();
  };

  const handleChangeTypeFromMenu = () => {
    moreOptionsSheetRef.current?.dismiss();

    const nextType =
      order.type === OrderType.IN_PLACE
        ? OrderType.TAKE_AWAY
        : OrderType.IN_PLACE;

    updateOrder({
      id: order.id,
      typeOrder: nextType,
      tableId: nextType === OrderType.IN_PLACE ? order.table?.id : undefined,
    });
  };

  const handleChangeTableFromMenu = () => {
    moreOptionsSheetRef.current?.dismiss();
    handlePresentTableSelector();
  };

  const handleMergeFromMenu = () => {
    moreOptionsSheetRef.current?.dismiss();
    mergeOrderBottomSheetRef.current?.present();
  };

  const confirmMergeOrder = (target: Order) => {
    setMergeTarget(target);
    setMergeDialogVisible(true);
  };

  const handleMergeOrder = () => {
    if (!mergeTarget) return;
    // Close the dialog first so it doesn't stack under the socket loader sheet
    setMergeDialogVisible(false);
    mergeOrder(
      { sourceOrderId: order.id, targetOrderId: mergeTarget.id },
      {
        onSuccess: (resp) => {
          // The mutation sets the merged order as active; embedded panes
          // just re-render with it.
          if (resp.data?.order && !embedded) {
            router.replace(`/(order)/${resp.data.order.num}`);
          }
        },
      },
    );
  };

  const handleAddNoteFromMenu = () => {
    moreOptionsSheetRef.current?.dismiss();
    handlePresentEditNoteModal();
  };

  const handlePrintFromMenu = () => {
    moreOptionsSheetRef.current?.dismiss();
    router.push(`/(order)/${order.id}/print`);
  };

  const handleShareFromMenu = () => {
    moreOptionsSheetRef.current?.dismiss();
    handleShareOrder();
  };

  const handleCloseFromMenu = () => {
    moreOptionsSheetRef.current?.dismiss();
    handleCloseOrder();
  };

  const handleForceCloseFromMenu = () => {
    moreOptionsSheetRef.current?.dismiss();
    handleCloseOrder();
  };

  const handleDeleteFromMenu = () => {
    moreOptionsSheetRef.current?.dismiss();

    if (orderCantBeDeleted) {
      i18nAlert(
        t("orders:deleteAlerts.cannotDelete"),
        t("orders:deleteAlerts.cannotDeleteMessage"),
      );
      return;
    }

    setVisible(true);
  };

  const otherOrderType =
    order.type === OrderType.IN_PLACE
      ? OrderType.TAKE_AWAY
      : OrderType.IN_PLACE;
  const otherOrderTypeLabel = t(
    otherOrderType === OrderType.IN_PLACE
      ? "common:orderType.inPlace"
      : "common:orderType.takeAway",
  );

  const editOptions: MoreOptionItem[] = !isClosed
    ? [
        {
          icon: "square-pen",
          label: t("common:actions.edit"),
          onPress: handleEditFromMenu,
        },
        {
          icon: "arrow-left-right",
          label: t("orders:options.changeType", {
            type: otherOrderTypeLabel,
          }),
          onPress: handleChangeTypeFromMenu,
        },
        ...(order.type === OrderType.IN_PLACE
          ? [
              {
                icon: "layout-grid" as const,
                label: t("orders:options.changeTable"),
                onPress: handleChangeTableFromMenu,
              },
            ]
          : []),
        ...(hasOtherOpenOrders
          ? [
              {
                icon: "git-merge" as const,
                label: t("orders:options.mergeOrder"),
                onPress: handleMergeFromMenu,
              },
            ]
          : []),
        {
          icon: "file-text",
          label: t("orders:form.addNote"),
          onPress: handleAddNoteFromMenu,
        },
      ]
    : [];

  const generalOptions: MoreOptionItem[] = [
    {
      icon: "printer",
      label: t("common:actions.print"),
      onPress: handlePrintFromMenu,
    },
    {
      icon: "share",
      label: t("common:actions.share"),
      onPress: handleShareFromMenu,
    },
    ...(order.status === OrderStatus.DELIVERED &&
    order.isClosed === false &&
    order.isPaid === true
      ? [
          {
            icon: "lock" as const,
            label: t("common:actions.close"),
            onPress: handleCloseFromMenu,
          },
        ]
      : []),
    ...(isAdmin && canForceCloseOrder
      ? [
          {
            icon: "lock" as const,
            label: t("orders:options.forceCloseOrder"),
            onPress: handleForceCloseFromMenu,
          },
        ]
      : []),
  ];

  const dangerOptions: MoreOptionItem[] = !isClosed
    ? [
        {
          icon: "trash",
          label: t("orders:options.deleteOrder"),
          onPress: handleDeleteFromMenu,
          disabled: orderCantBeDeleted,
        },
      ]
    : [];

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
          <View style={tw`bg-surface-bright rounded-2xl w-4/5 max-w-md p-5 shadow-lg`}>
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
      <CloseOrderModal
        order={order}
        visible={closeModalIsOpen}
        onClose={closeCloseModal}
      />
      <View style={tw`flex-1 relative`}>
        <Container
          style={tw`px-4 ${embedded ? "pt-2" : "pt-6"} flex-1 bg-background`}
        >
          {/* Pane header: stands in for the stack header when embedded */}
          {embedded && (
            <ThemedView style={tw`flex-row items-center justify-between mb-2`}>
              <IconButton
                icon="x"
                accessibilityLabel={t("common:actions.close")}
                onPress={() => setActiveOrder(null)}
                size={24}
              />
              {renderHeaderActions()}
            </ThemedView>
          )}
          {/* Header Section */}
          <ThemedView style={tw`mb-4 gap-4`}>
            {showTimePicker && (
              <ThemedView style={tw`mt-3`}>
                {Platform.OS === "ios" && (
                  <ThemedView
                    style={tw`border border-gray-300 rounded-2xl overflow-hidden`}
                  >
                    <DateTimePicker
                      value={
                        pickerValue ?? (deliveryTime ?? createdAt).toDate()
                      }
                      mode="time"
                      display="spinner"
                      onValueChange={handleTimeChange}
                    />
                    <Button
                      label={t("common:actions.confirm")}
                      onPress={handleConfirmTime}
                      variant="primary"
                      size="small"
                    />
                  </ThemedView>
                )}
                {Platform.OS === "android" && (
                  <DateTimePicker
                    value={pickerValue ?? (deliveryTime ?? createdAt).toDate()}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onValueChange={handleTimeChange}
                  />
                )}
              </ThemedView>
            )}

            {/* Table/Location & People */}
            <ThemedView style={tw`flex-row items-center justify-between`}>
              <ThemedView style={tw`gap-2`}>
                <ThemedView style={tw`flex-row items-center gap-2`}>
                  <ThemedText type="caption" style={tw`text-gray-500 text-sm`}>
                    {orderNumberText(order, t)}
                  </ThemedText>
                  <OrderSyncLabel orderId={order.id} />
                </ThemedView>
                <ThemedView style={tw`flex-row items-center gap-2`}>
                  <Icon
                    name={
                      order.type === OrderType.IN_PLACE
                        ? "utensils"
                        : "shopping-bag"
                    }
                    size={24}
                    color={tw.color("primary")}
                  />
                  <ThemedText type="h2">
                    {order.type === OrderType.IN_PLACE
                      ? `${t("common:labels.table")} ${order.table?.name}`
                      : t("common:labels.takeAway")}
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              {order.status !== OrderStatus.DELIVERED &&
                order.status !== OrderStatus.CANCELLED && (
                  <OrderElapsedTimeLabel deliveryTime={order.deliveryTime} />
                )}
            </ThemedView>
          </ThemedView>

          {/* Tab Content */}
          <ThemedView style={tw`flex-1`}>
            {activeTab === "products" && (
              <ScrollView
                style={tw`flex-1`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={tw`pb-10`}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={primaryColor}
                    colors={[primaryColor]}
                  />
                }
              >
                {/* Status & Payment Labels */}

                <ThemedView
                  style={tw`flex-row items-center gap-2 flex-wrap mb-4 rounded-xl`}
                >
                  <Label
                    text={statusText}
                    color={labelColor}
                    leftIcon={statusIcon}
                    size="small"
                  />

                  {order.paymentStatus !== OrderPaymentStatus.UNPAID && (
                    <Label
                      text={paymentStatus.text}
                      color={paymentStatus.color}
                      size="small"
                    />
                  )}
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
                </ThemedView>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={tw`gap-2 mb-6`}
                >
                  <Chip
                    icon="hourglass"
                    label={(deliveryTime ?? createdAt).format("HH:mm")}
                    onPress={openTimePicker}
                  />
                  <Chip
                    label={String(order.people)}
                    icon="users"
                    onPress={
                      !isClosed ? handlePresentEditPeopleModal : undefined
                    }
                  />

                  <Chip
                    icon="user"
                    label={`${order.user?.person.firstName} ${order.user?.person.lastName}`}
                    onPress={!isClosed ? handlePresentReassignModal : undefined}
                  />
                </ScrollView>

                {/* Notes Section */}
                {order.notes && (
                  <ThemedView style={tw`mb-6   rounded-xl`}>
                    <ThemedView style={tw`flex-row items-center gap-2 mb-2`}>
                      <Icon
                        name="file-text"
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
                    <ThemedText type="body1" style={tw`text-gray-700`}>
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
                      <ThemedView style={tw`flex-row items-center gap-2`}>
                        <ThemedText type="body2" style={tw`text-gray-500`}>
                          {t("orders:details.pendingItems")}
                        </ThemedText>
                        <ThemedView
                          style={tw`bg-primary-50 px-2.5 py-1 rounded-full`}
                        >
                          <ThemedText
                            type="small"
                            style={tw`text-primary-700 font-semibold`}
                          >
                            {pendingDetails.length}
                          </ThemedText>
                        </ThemedView>
                      </ThemedView>
                    </ThemedView>
                    <ThemedView style={tw`gap-6`}>
                      {pendingDetails.map((detail) => (
                        <OrderDetailCard
                          key={detail.id}
                          detail={detail}
                          onPress={() => openProduct(detail)}
                          orderUserId={order.user?.id || ""}
                          orderType={order.type}
                          selectionMode={isSelectionMode}
                          selected={selectedDetailIds.has(detail.id)}
                          onToggleSelect={toggleSelectDetail}
                          onStartSelection={enterSelectionMode}
                          showAmount={false}
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
                            <ThemedText
                              type="caption"
                              style={tw`text-gray-600`}
                            >
                              {deliveredDetails.length}
                            </ThemedText>
                          </ThemedView>
                        </ThemedView>
                        <Icon
                          name={
                            isDeliveredExpanded
                              ? "chevron-up"
                              : "chevron-down"
                          }
                          size={20}
                          color={tw.color("gray-400")}
                        />
                      </ThemedView>
                    </Pressable>

                    {isDeliveredExpanded && (
                      <ThemedView style={tw`gap-3 mt-2 `}>
                        {deliveredDetails.map((detail) => (
                          <OrderDetailCard
                            key={detail.id}
                            detail={detail}
                            onPress={() => openProduct(detail)}
                            orderUserId={order.user?.id || ""}
                            orderType={order.type}
                            showAmount={false}
                          />
                        ))}
                      </ThemedView>
                    )}
                  </ThemedView>
                )}

                {/* Cancelled Items Section */}
                {cancelledDetails.length > 0 && (
                  <ThemedView style={tw`mb-6`}>
                    <Pressable onPress={toggleCancelledSection}>
                      <ThemedView
                        style={tw`flex-row justify-between items-center py-3`}
                      >
                        <ThemedView style={tw`flex-row items-center gap-2`}>
                          <ThemedText type="body2" style={tw`text-gray-500`}>
                            {t("orders:details.cancelledItems")}
                          </ThemedText>
                          <ThemedView
                            style={tw`bg-gray-100 px-2 py-0.5 rounded-full`}
                          >
                            <ThemedText
                              type="caption"
                              style={tw`text-gray-600`}
                            >
                              {cancelledDetails.length}
                            </ThemedText>
                          </ThemedView>
                        </ThemedView>
                        <Icon
                          name={
                            isCancelledExpanded
                              ? "chevron-up"
                              : "chevron-down"
                          }
                          size={20}
                          color={tw.color("gray-400")}
                        />
                      </ThemedView>
                    </Pressable>

                    {isCancelledExpanded && (
                      <ThemedView style={tw`gap-6 mt-2 opacity-70`}>
                        {cancelledDetails.map((detail) => (
                          <OrderDetailCard
                            key={detail.id}
                            detail={detail}
                            onPress={() => {}}
                            orderUserId={order.user?.id || ""}
                            orderType={order.type}
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
                      <ThemedView
                        style={tw`bg-gray-100 px-2.5 py-1 rounded-full`}
                      >
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
                          orderUserId={order.user?.id || ""}
                          orderType={order.type}
                        />
                      ))}
                    </ThemedView>
                  </ThemedView>
                )}

                {/* Empty state for closed orders with no items */}
                {isClosed && !hasItems && (
                  <ThemedView style={tw`mb-6 p-8 items-center justify-center`}>
                    <Icon
                      name="file"
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
                {/* {!isClosed && ( */}
                {/*   <Button */}
                {/*     leftIcon="add-outline" */}
                {/*     label={t("orders:details.addProduct")} */}
                {/*     variant="outline" */}
                {/*     onPress={() => { */}
                {/*       init(order); // Initialize the edit order cart store with the current order */}
                {/**/}
                {/*       router.push("/(new-order)/restaurant-menu"); */}
                {/*     }} */}
                {/*   /> */}
                {/* )} */}

                {/* <ThemedView style={tw`flex-row gap-4`}> */}
                {/*   <ThemedView style={tw`flex-1`}> */}
                {/*     <Card */}
                {/*       style={tw`gap-2 flex-1 pt-10`} */}
                {/*       onPress={() => setActiveTab("bills")} */}
                {/*     > */}
                {/*       <Icon name="cash-outline" size={22} /> */}
                {/*       <ThemedView style={tw``}> */}
                {/*         <ThemedText */}
                {/*           type="body2" */}
                {/*           style={[tw``, { fontFamily: typography.medium }]} */}
                {/*         > */}
                {/*           {t("orders:details.payments")} */}
                {/*         </ThemedText> */}
                {/*       </ThemedView> */}
                {/*     </Card> */}
                {/*   </ThemedView> */}
                {/**/}
                {/*   <ThemedView style={tw`flex-1`}> */}
                {/*     <Card */}
                {/*       style={tw`gap-2 flex-1 pt-10`} */}
                {/*       onPress={() => setActiveTab("tickets")} */}
                {/*     > */}
                {/*       <Icon name="receipt-outline" size={22} /> */}
                {/*       <ThemedView style={tw` gap-1`}> */}
                {/*         <ThemedText */}
                {/*           type="body2" */}
                {/*           style={[tw``, { fontFamily: typography.medium }]} */}
                {/*         > */}
                {/*           {t("orders:details.orderTickets")} */}
                {/*         </ThemedText> */}
                {/*       </ThemedView> */}
                {/*     </Card> */}
                {/*   </ThemedView> */}
                {/* </ThemedView> */}

                <ThemedView style={tw`mt-4 mb-20`}>
                  <ThemedText type="caption" style={tw`text-gray-500`}>
                    {t("orders:details.activity")}
                  </ThemedText>
                  <ThemedView style={tw`mt-3 gap-2`}>
                    <ThemedView>
                      <ThemedView style={tw`flex-row items-center gap-2`}>
                        <Icon
                          name="circle"
                          size={12}
                          color={tw.color("gray-500")}
                        />
                        <ThemedText type="body2" style={tw`text-gray-600`}>
                          {t("orders:details.createdAt")}
                        </ThemedText>
                      </ThemedView>
                      <ThemedText type="small" style={tw`text-gray-500 ml-5`}>
                        {createdAtLabel}
                      </ThemedText>
                    </ThemedView>
                    <ThemedView>
                      <ThemedView style={tw`flex-row items-center gap-2`}>
                        <Icon
                          name="circle"
                          size={12}
                          color={tw.color("gray-500")}
                        />
                        <ThemedText type="body2" style={tw`text-gray-600`}>
                          {t("orders:details.updatedAt")}
                        </ThemedText>
                      </ThemedView>
                      <ThemedText type="small" style={tw`text-gray-500 ml-5`}>
                        {updatedAtLabel}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              </ScrollView>
            )}

            {activeTab === "bills" && <OrderBillsTab order={order} />}
            {activeTab === "tickets" && <OrderTicketsTab order={order} />}
          </ThemedView>
        </Container>

        {/* Footer - Total */}
        <ThemedView
          style={tw`px-4 py-4 border-t border-border bg-background`}
        >
          <ThemedView style={tw`flex-row justify-between items-center`}>
            <ThemedText type="h4" style={tw`text-gray-600`}>
              {t("common:labels.total")}
            </ThemedText>
            <ThemedText type="h2" style={tw``}>
              {formatCurrency(order.total)}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Selection Bar */}
        {isSelectionMode && (
          <View style={tw`absolute bottom-20 left-4 right-4 items-center`}>
            <ThemedView
              style={tw`w-full flex-row items-center gap-1 bg-surface rounded-full shadow-sm px-2 py-2`}
            >
              <IconButton
                icon="x"
                variant="text"
                onPress={cancelSelectionMode}
                accessibilityLabel={t(
                  "orders:details.selection.cancelSelection",
                )}
              />
              <ThemedText
                type="body1"
                numberOfLines={1}
                style={[tw`flex-1`, { fontFamily: typography.medium }]}
              >
                {t("orders:details.selection.selectedCount", {
                  count: selectedDetails.length,
                })}
              </ThemedText>
              <Button
                variant="text"
                size="small"
                label={
                  allDetailsSelected
                    ? t("orders:details.selection.unselectAll")
                    : t("orders:details.selection.selectAll")
                }
                onPress={toggleSelectAllDetails}
              />
              <Button
                variant="secondary"
                size="small"
                leftIcon="check-check"
                label={t("orders:details.selection.deliver")}
                disabled={selectedDetails.length === 0}
                onPress={deliverSelected}
              />
            </ThemedView>
          </View>
        )}

        {/* Floating Toolbar */}
        {!isSelectionMode && (
          <View style={tw`absolute bottom-20 left-0 right-0 items-center`}>
            <ThemedView style={tw`flex-row items-center gap-3 bg-transparent`}>
              <FloatingToolbar
                items={[
                  {
                    icon: "hamburger",
                    label: t("orders:details.tabs.products"),
                    onPress: () => setActiveTab("products"),
                    active: activeTab === "products",
                  },
                  {
                    icon: "banknote",
                    label: t("orders:details.tabs.bills"),
                    onPress: () => setActiveTab("bills"),
                    active: activeTab === "bills",
                  },
                  {
                    icon: "receipt-text",
                    label: t("orders:details.tabs.tickets"),
                    onPress: () => setActiveTab("tickets"),
                    active: activeTab === "tickets",
                  },
                ]}
              />

              {(activeTab === "products" ||
                (activeTab === "bills" && remainingAmount > 0)) && (
                <IconButton
                  onPress={
                    activeTab === "products" ? handleAddProduct : handleAddBill
                  }
                  icon={
                    activeTab === "products" ? "plus" : "credit-card"
                  }
                  size={40}
                  variant="secondary"
                ></IconButton>
              )}
            </ThemedView>
          </View>
        )}
      </View>

      <ThemedBottomSheetModal ref={editBottomSheetRef} enablePanDownToClose>
        {order && (
          <EditOrderBottomSheet
            order={order}
            onOrderUpdated={closeEditBottomSheet}
          />
        )}
      </ThemedBottomSheetModal>

      <ReassignOrderBottomSheet
        ref={reassignBottomSheetRef}
        selectedUserId={order.user?.id}
        onSelectUser={(selected) => {
          if (selected.id === order.user?.id) return;
          updateOrder({ id: order.id, userId: selected.id });
        }}
      />

      <ThemedBottomSheetModal
        ref={editPeopleBottomSheetRef}
        enablePanDownToClose
      >
        {order && (
          <EditPeopleBottomSheet
            order={order}
            onClose={closeEditPeopleBottomSheet}
          />
        )}
      </ThemedBottomSheetModal>

      <TableSelectorBottomSheet
        ref={tableSelectorBottomSheetRef}
        selectedTableId={order.table?.id}
        onSelectTable={(selected) => {
          if (selected.id === order.table?.id) return;
          updateOrder({ id: order.id, tableId: selected.id });
        }}
      />

      <MergeOrderBottomSheet
        ref={mergeOrderBottomSheetRef}
        order={order}
        onSelectOrder={confirmMergeOrder}
      />

      <DialogModal
        visible={mergeDialogVisible}
        title={t("orders:merge.confirmTitle")}
        message={t("orders:merge.confirmMessage", {
          source: order.num,
          target: mergeTarget?.num,
        })}
        confirmLabel={t("orders:merge.confirm")}
        onConfirm={handleMergeOrder}
        onCancel={() => setMergeDialogVisible(false)}
      />

      <ThemedBottomSheetModal ref={editNoteBottomSheetRef} enablePanDownToClose>
        {order && (
          <EditNoteBottomSheet
            order={order}
            onClose={closeEditNoteBottomSheet}
          />
        )}
      </ThemedBottomSheetModal>

      {/* More Options Bottom Sheet */}
      <ThemedBottomSheetModal ref={moreOptionsSheetRef} enablePanDownToClose>
        <ActionsBottomSheet
          sections={[
            { items: editOptions },
            { items: generalOptions },
            {
              items: dangerOptions.map((option) => ({
                ...option,
                color: "text-red-500",
              })),
            },
          ]}
        />
      </ThemedBottomSheetModal>
    </>
  );
}
