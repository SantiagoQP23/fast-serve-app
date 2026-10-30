import { Pressable, RefreshControl } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation, useRouter } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
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
import { formatCurrency } from "@/core/i18n/utils";
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
import TabBar from "@/presentation/theme/components/tab-bar";
import TabPager from "@/presentation/theme/components/tab-pager";
import EditOrderBottomSheet from "@/presentation/orders/components/edit-order-bottom-sheet";
import ChangeItemsTypeBottomSheet, {
  itemsToChangeType,
  type ChangeItemsTypeBottomSheetRef,
} from "@/presentation/orders/components/change-items-type-bottom-sheet";
import { UpdateOrderDto } from "@/core/orders/dto/update-order.dto";
import ReassignOrderBottomSheet, {
  type ReassignOrderBottomSheetRef,
} from "@/presentation/orders/components/reassign-order-bottom-sheet";
import PeopleBottomSheet, {
  type PeopleBottomSheetRef,
} from "@/presentation/orders/components/people-bottom-sheet";
import DeliveryTimeBottomSheet, {
  type DeliveryTimeBottomSheetRef,
} from "@/presentation/orders/components/delivery-time-bottom-sheet";
import OrderInformation from "@/presentation/orders/components/order-information";
import DetailHeader from "@/presentation/theme/components/detail-header";
import {
  CollapsibleHeaderTitle,
  useCollapsibleHeaderScroll,
} from "@/presentation/theme/components/collapsible-header-title";
import TableSelectorBottomSheet, {
  type TableSelectorBottomSheetRef,
} from "@/presentation/orders/components/table-selector-bottom-sheet";
import EditNoteBottomSheet from "@/presentation/orders/components/edit-note-bottom-sheet";
import {
  Order,
  getOrderDeleteBlockReason,
} from "@/core/orders/models/order.model";
import { BillStatus } from "@/core/orders/models/bill.model";
import { getBillAmountDue } from "@/core/orders/utils/bill-payment.util";
import { useTickets } from "@/presentation/orders/hooks/useTickets";
import MergeOrderBottomSheet, {
  type MergeOrderBottomSheetRef,
} from "@/presentation/orders/components/merge-order-bottom-sheet";
import CloseOrderModal from "@/presentation/orders/components/close-order-modal";
import InfoBottomSheet from "@/presentation/theme/components/info-bottom-sheet";

import { useEditOrderCartStore } from "@/presentation/orders/store/editOrderCartStore";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { useMarkOrderDelivered } from "@/presentation/orders/hooks/useMarkOrderDelivered";
import IconButton from "@/presentation/theme/components/icon-button";
import { useBills } from "@/presentation/orders/hooks/useBills";
import ActionsBottomSheet, {
  type ActionsBottomSheetItem,
} from "@/presentation/theme/components/actions-bottom-sheet";
import OrderBillsTab from "@/presentation/orders/components/order-bills-tab";
import OrderTicketsTab from "@/presentation/orders/components/order-tickets-tab";
import { typography } from "@/constants/theme";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import OrderSyncLabel from "@/presentation/offline/components/order-sync-label";
import { orderNumberText } from "@/presentation/offline/local-order";

dayjs.extend(relativeTime);

const DATE_FORMAT = "DD MMM YYYY, HH:mm";

type MoreOptionItem = ActionsBottomSheetItem;

type OrderTab = "products" | "bills" | "tickets";

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
  const order = useOrdersStore((state) => state.activeOrder);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const setActiveOrderDetail = useOrdersStore(
    (state) => state.setActiveOrderDetail,
  );

  const init = useEditOrderCartStore((state) => state.init);
  const { mutate: updateOrder } = useOrders().updateOrder;
  const { mutate: deleteOrder } = useOrders().deleteOrder;
  const { mutate: updateOrderDetails } = useOrders().updateOrderDetails;
  const updateOrderInStore = useOrdersStore((state) => state.updateOrder);
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
  const { isLoading: isLoadingOrder } = useOrder(order?.id || null);
  const { paymentStatus } = useOrderPaymentStatus(
    order?.paymentStatus || OrderPaymentStatus.UNPAID,
  );
  const { data: orderBills } = useBills().billsByOrderQuery(order?.id || "");
  const { tickets } = useTickets(order?.id ?? null);
  const insets = useSafeAreaInsets();

  const {
    isOpen: closeModalIsOpen,
    handleOpen: openCloseModal,
    handleClose: closeCloseModal,
  } = useModal();

  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [isCancelledExpanded, setIsCancelledExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<OrderTab>("products");
  const [mergeTarget, setMergeTarget] = useState<Order | null>(null);
  const [mergeDialogVisible, setMergeDialogVisible] = useState(false);
  const [selectionRequested, setSelectionRequested] = useState(false);
  const [selectedDetailIds, setSelectedDetailIds] = useState<Set<string>>(
    new Set(),
  );
  // Call all hooks before any conditional returns
  const { statusText, labelColor, statusIcon } = useOrderStatus(
    order?.status || OrderStatus.PENDING,
  );
  const { handleShareOrder } = useOrderPrint(order);

  const editBottomSheetRef = useRef<BottomSheetMethods>(null);
  const reassignBottomSheetRef = useRef<ReassignOrderBottomSheetRef>(null);
  const peopleSheetRef = useRef<PeopleBottomSheetRef>(null);
  const deliveryTimeSheetRef = useRef<DeliveryTimeBottomSheetRef>(null);
  const tableSelectorBottomSheetRef = useRef<TableSelectorBottomSheetRef>(null);
  const mergeOrderBottomSheetRef = useRef<MergeOrderBottomSheetRef>(null);
  const editNoteBottomSheetRef = useRef<BottomSheetMethods>(null);
  const moreOptionsSheetRef = useRef<BottomSheetMethods>(null);
  // One scroll for the whole screen; the TabBar sticks once the header (above
  // it) scrolls away.
  const scrollRef = useRef<Animated.ScrollView>(null);
  const headerHeightRef = useRef(0);
  // The place title fades into the nav header as the screen scrolls, like
  // the table and cart screens.
  const { scrollY, scrollHandler } = useCollapsibleHeaderScroll();
  const navigation = useNavigation();
  const deleteBlockedSheetRef = useRef<BottomSheetMethods>(null);
  const typeTableSelectorRef = useRef<TableSelectorBottomSheetRef>(null);
  const changeItemsTypeSheetRef = useRef<ChangeItemsTypeBottomSheetRef>(null);
  // The order change waiting for the "which items also change" answer.
  const pendingTypeChangeRef = useRef<UpdateOrderDto | null>(null);

  const closeEditBottomSheet = () => {
    editBottomSheetRef.current?.close();
  };

  const handlePresentEditModal = useCallback(() => {
    editBottomSheetRef.current?.present();
  }, []);

  const handlePresentReassignModal = useCallback(() => {
    reassignBottomSheetRef.current?.present();
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

  const orderId = order?.id;
  const handlePrint = useCallback(() => {
    if (orderId) router.push(`/(order)/${orderId}/print`);
  }, [orderId, router]);

  // Past the header, a new tab starts at its top under the pinned TabBar
  // instead of mid-way down at the old tab's scroll position.
  useEffect(() => {
    if (scrollY.value > headerHeightRef.current) {
      scrollRef.current?.scrollTo({
        y: headerHeightRef.current,
        animated: false,
      });
    }
  }, [activeTab, scrollY]);

  const headerPlace = !order
    ? ""
    : order.type === OrderType.IN_PLACE
      ? `${t("common:labels.table")} ${order.table?.name}`
      : t("common:labels.takeAway");
  const headerNumber = order ? orderNumberText(order, t) : "";

  useEffect(() => {
    // Embedded in a pane: there's no nav header to collapse into
    if (embedded) return;
    navigation.setOptions({
      headerTitle: () => (
        <CollapsibleHeaderTitle
          scrollY={scrollY}
          title={headerPlace}
          subtitle={headerNumber}
        />
      ),
    });
  }, [embedded, navigation, scrollY, headerPlace, headerNumber]);

  const onRefresh = useCallback(async () => {
    if (!order?.id) return;

    try {
      setRefreshing(true);
      // Trigger haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // The order, and the bills and tickets shown in its tabs
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["order", order.id] }),
        queryClient.refetchQueries({ queryKey: ["bills", order.id] }),
        queryClient.refetchQueries({ queryKey: ["tickets", order.id] }),
      ]);
    } catch {
      // Non-blocking: the order on screen stays usable.
      toast.error(t("errors:order.ordersFetchFailed"));
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

  const deleteBlockReason = getOrderDeleteBlockReason(order);

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
  // Not on any bill yet: charging it means creating a bill first.
  const remainingAmount = Math.max(order.total - orderAmountInBills, 0);
  const unpaidBills = (orderBills ?? []).filter(
    (bill) => bill.status !== BillStatus.PAID && getBillAmountDue(bill) > 0,
  );
  // Already on a bill but not collected yet.
  const billsAmountDue = unpaidBills.reduce(
    (acc, bill) => acc + getBillAmountDue(bill),
    0,
  );

  // Non-hook functions and computed values can be after the early return
  const openProduct = (detail: OrderDetail) => {
    // Prevent editing if order is closed
    if (isClosed) return;

    setActiveOrderDetail(detail);
    router.push(`/(order)/${order.num}/edit-order-detail`);
  };

  const createdAt = dayjs(order.createdAt);
  const deliveryTime = order.deliveryTime ? dayjs(order.deliveryTime) : null;

  const onRemoveOrder = () => {
    deleteOrder(order.id, {
      onSuccess: () => {
        setDeleteDialogVisible(false);
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

  const handlePeopleChange = (people: number) => {
    if (people === order.people) return;
    updateOrder({ id: order.id, people });
  };

  // Orders can't go back to "standard" once scheduled, so there's no clear.
  const handleDeliveryTimeChange = (time: Date | null) => {
    if (!time || (deliveryTime && dayjs(time).isSame(deliveryTime, "minute")))
      return;
    updateOrder({ id: order.id, deliveryTime: time });
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

  // A cancelled item lives in its own section even if it was handed out.
  const deliveredDetails = hasDetails
    ? order.details.filter(
        (detail) =>
          detail.status !== OrderDetailStatus.CANCELLED &&
          detail.qtyDelivered === detail.quantity,
      )
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

  const toggleCancelledSection = () => {
    setIsCancelledExpanded(!isCancelledExpanded);
  };

  const handleAddProduct = () => {
    init(order); // Initialize the edit order cart store with the current order

    router.push("/(new-order)/restaurant-menu");
  };

  // Charging the unbilled part starts a bill with every item selected.
  const handleChargeNewBill = () => {
    router.push({
      pathname: "/(order)/[id]/bills/new",
      params: { id: order.id, all: "1" },
    });
  };

  // Everything is on a bill already: go straight to the one left to charge.
  const handleChargeBills = () => {
    if (unpaidBills.length === 1) {
      router.push(`/(bills)/${unpaidBills[0].id}`);
      return;
    }
    setActiveTab("bills");
  };

  const handleEditFromMenu = () => {
    moreOptionsSheetRef.current?.dismiss();
    handlePresentEditModal();
  };

  /**
   * Saves a type change, then gives the chosen items the new type. Both
   * actions queue offline in this order when there's no connection.
   */
  const applyTypeChange = (dto: UpdateOrderDto, itemIds: string[]) => {
    const typeOrderDetail = dto.typeOrder;
    updateOrder(dto, {
      onSuccess: () => {
        if (!itemIds.length || !typeOrderDetail) return;
        updateOrderDetails(
          {
            orderId: dto.id,
            details: itemIds.map((id) => ({ id, typeOrderDetail })),
          },
          {
            onSuccess: (resp) => {
              // Online the server answers { order }; the outbox answers the order.
              const data = resp.data as unknown as
                Order | { order?: Order } | undefined;
              const updated: Order | undefined =
                data && "order" in data ? data.order : (data as Order);
              if (!updated?.id) return;
              updateOrderInStore(updated);
              if (useOrdersStore.getState().activeOrder?.id === updated.id) {
                setActiveOrder(updated);
              }
            },
            onError: (resp) => {
              toast.error(resp.msg);
            },
          },
        );
      },
    });
  };

  /** Asks which items also change type, unless none has the old one. */
  const startTypeChange = (dto: UpdateOrderDto) => {
    if (!dto.typeOrder) return;
    const items = itemsToChangeType(
      order.details.filter(
        (detail) =>
          detail.status !== OrderDetailStatus.CANCELLED &&
          detail.status !== OrderDetailStatus.DELIVERED,
      ),
      dto.typeOrder,
      order.type,
    );
    if (items.length === 0) {
      applyTypeChange(dto, []);
      return;
    }
    pendingTypeChangeRef.current = dto;
    changeItemsTypeSheetRef.current?.present(items, dto.typeOrder);
  };

  const handleConfirmItemsType = (itemIds: string[]) => {
    const dto = pendingTypeChangeRef.current;
    pendingTypeChangeRef.current = null;
    if (dto) applyTypeChange(dto, itemIds);
  };

  const handleChangeTypeFromMenu = () => {
    moreOptionsSheetRef.current?.dismiss();

    if (order.type === OrderType.TAKE_AWAY) {
      // An in-place order needs a table: pick it first.
      typeTableSelectorRef.current?.present();
      return;
    }

    startTypeChange({ id: order.id, typeOrder: OrderType.TAKE_AWAY });
  };

  const handleEditTypeChange = (dto: UpdateOrderDto) => {
    closeEditBottomSheet();
    startTypeChange(dto);
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

  const handleChangeTableFromMenu = () => {
    moreOptionsSheetRef.current?.dismiss();
    handlePresentTableSelector();
  };

  const handleAddNoteFromMenu = () => {
    moreOptionsSheetRef.current?.dismiss();
    handlePresentEditNoteModal();
  };

  const handleShareFromMenu = () => {
    moreOptionsSheetRef.current?.dismiss();
    handleShareOrder();
  };

  const handleForceCloseFromMenu = () => {
    moreOptionsSheetRef.current?.dismiss();
    handleCloseOrder();
  };

  // Opens over the options sheet, so closing it lands back on the options.
  const showDeleteBlockedReason = () => {
    deleteBlockedSheetRef.current?.present();
  };

  const handleDeleteFromMenu = () => {
    if (deleteBlockReason) return;
    moreOptionsSheetRef.current?.dismiss();
    setDeleteDialogVisible(true);
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
        ...(order.type === OrderType.IN_PLACE
          ? [
              {
                icon: "layout-grid" as const,
                label: t("orders:options.changeTable"),
                onPress: handleChangeTableFromMenu,
              },
            ]
          : []),
        ...(order.status !== OrderStatus.DELIVERED
          ? [
              {
                icon: "arrow-left-right" as const,
                label: t("orders:options.changeType", {
                  type: otherOrderTypeLabel,
                }),
                onPress: handleChangeTypeFromMenu,
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
      icon: "share",
      label: t("common:actions.share"),
      onPress: handleShareFromMenu,
    },
    ...(canForceCloseOrder
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
          // Blocked: dimmed, with the info button explaining why.
          disabled: !!deleteBlockReason,
          info: deleteBlockReason
            ? {
                accessibilityLabel: t("orders:deleteBlocked.infoLabel"),
                onPress: showDeleteBlockedReason,
              }
            : undefined,
          onPress: handleDeleteFromMenu,
        },
      ]
    : [];

  const unpaidAmount = remainingAmount + billsAmountDue;

  // The bar's primary action follows the order's next step: charge what's
  // left, then deliver what's pending, then close.
  const chargeAction =
    remainingAmount > 0
      ? { amount: remainingAmount, onPress: handleChargeNewBill }
      : billsAmountDue > 0
        ? { amount: billsAmountDue, onPress: handleChargeBills }
        : null;
  const deliverInBar = !chargeAction && canMarkDelivered;
  const closeInBar = !chargeAction && !deliverInBar && canCloseOrder;
  const hasBarAction =
    !isClosed && (!!chargeAction || deliverInBar || closeInBar);

  const productsCount = allDetails.filter(
    (detail) => detail.status !== OrderDetailStatus.CANCELLED,
  ).length;
  const tabs = [
    {
      value: "products" as const,
      label: t("orders:details.tabs.products"),
      count: productsCount || undefined,
    },
    {
      value: "bills" as const,
      label: t("orders:details.tabs.bills"),
      count: orderBills?.length || undefined,
    },
    {
      value: "tickets" as const,
      label: t("orders:details.tabs.tickets"),
      count: tickets.length || undefined,
    },
  ];

  const renderSectionHeader = (title: string, count: number) => (
    <ThemedView style={tw`flex-row items-center gap-2`}>
      <ThemedText
        type="body2"
        style={[tw`text-gray-500`, { fontFamily: typography.semibold }]}
      >
        {title}
      </ThemedText>
      <ThemedText type="body2" style={tw`text-gray-500`}>
        {count}
      </ThemedText>
    </ThemedView>
  );

  const renderRefreshControl = () => (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={primaryColor}
      colors={[primaryColor]}
    />
  );

  return (
    <>
      <DialogModal
        visible={deleteDialogVisible}
        title={t("orders:dialogs.removeTitle")}
        message={t("orders:dialogs.removeMessage")}
        confirmLabel={t("orders:dialogs.deleteConfirm")}
        confirmVariant="destructive"
        onConfirm={onRemoveOrder}
        onCancel={() => setDeleteDialogVisible(false)}
      />
      <CloseOrderModal
        order={order}
        visible={closeModalIsOpen}
        onClose={closeCloseModal}
        unpaidAmount={order.isPaid ? 0 : unpaidAmount}
      />
      <ThemedView style={tw`flex-1`}>
        <Container
          style={tw`px-4 ${embedded ? "pt-2" : "pt-4"} flex-1 bg-background`}
        >
          {/* Pane header: stands in for the stack header when embedded */}
          {embedded && (
            <ThemedView style={tw`flex-row items-center mb-2`}>
              <IconButton
                icon="x"
                accessibilityLabel={t("common:actions.close")}
                onPress={() => setActiveOrder(null)}
                size={24}
              />
            </ThemedView>
          )}
          {/* Everything scrolls; the TabBar (child 1) sticks at the top */}
          <Animated.ScrollView
            ref={scrollRef}
            style={tw`flex-1`}
            showsVerticalScrollIndicator={false}
            stickyHeaderIndices={[1]}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            refreshControl={renderRefreshControl()}
          >
            {/* Header: where, and the order's information */}
            <ThemedView
              style={tw`gap-4 pb-4`}
              onLayout={(e) => {
                headerHeightRef.current = e.nativeEvent.layout.height;
              }}
            >
              {/* Same header as the bill, led by the place instead of an
                  amount */}
              <DetailHeader
                title={headerPlace}
                scrollY={embedded ? undefined : scrollY}
                subtitle={`${orderNumberText(order, t)} · ${createdAt.format(DATE_FORMAT)}`}
                status={
                  // Status next to the time left, then payment, closed, sync
                  <ThemedView style={tw`flex-row items-center gap-2 flex-wrap`}>
                    <Label
                      text={statusText}
                      color={labelColor}
                      leftIcon={statusIcon}
                      size="small"
                    />
                    {!isClosed &&
                      order.status !== OrderStatus.DELIVERED &&
                      order.status !== OrderStatus.CANCELLED && (
                        <OrderElapsedTimeLabel
                          deliveryTime={order.deliveryTime}
                          size="small"
                        />
                      )}
                    {order.paymentStatus !== OrderPaymentStatus.UNPAID && (
                      <Label
                        text={paymentStatus.text}
                        color={paymentStatus.color}
                        size="small"
                      />
                    )}
                    {isClosed && (
                      <Label
                        text={t("orders:details.closedOrder")}
                        color="default"
                        size="small"
                      />
                    )}
                    <OrderSyncLabel orderId={order.id} />
                  </ThemedView>
                }
              >
                {/* Actions, like the bill screen's; charging lives in the
                  bottom bar */}
                <ThemedView style={tw`flex-row flex-wrap gap-3`}>
                  {!isClosed && (
                    <Button
                      label={t("orders:details.addProduct")}
                      leftIcon="plus"
                      shape="rounded"
                      size="small"
                      onPress={handleAddProduct}
                    />
                  )}
                  <Button
                    leftIcon="printer"
                    variant="surface"
                    shape="rounded"
                    size="small"
                    accessibilityLabel={t("common:actions.print")}
                    onPress={handlePrint}
                  />
                  <Button
                    leftIcon="ellipsis"
                    variant="surface"
                    shape="rounded"
                    size="small"
                    accessibilityLabel={t("orders:details.moreOptions")}
                    onPress={handleOpenMoreOptions}
                  />
                </ThemedView>
              </DetailHeader>

              {/* Note, like the cart's, and the time/people/waiter chips */}
              <OrderInformation
                order={order}
                editable={!isClosed}
                onEditNote={handlePresentEditNoteModal}
                onEditPeople={() => peopleSheetRef.current?.present()}
                onEditDeliveryTime={() =>
                  deliveryTimeSheetRef.current?.present()
                }
                onEditWaiter={handlePresentReassignModal}
              />
            </ThemedView>

            <ThemedView style={tw`bg-background`}>
              <TabBar
                scrollable
                gap={6}
                tabs={tabs}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
            </ThemedView>

            {/* Tab Content; drag left/right to switch tabs (off while
              selecting products) */}
            <TabPager
              tabs={tabs}
              activeTab={activeTab}
              onChange={setActiveTab}
              enabled={!isSelectionMode}
              autoHeight
              renderScene={(tab) => (
                <>
                  {tab === "products" && (
                    <ThemedView style={tw`pt-4 pb-6`}>
                      {/* Pending Items Section */}
                      {!isClosed && pendingDetails.length > 0 && (
                        <ThemedView style={tw`mb-6`}>
                          <ThemedView
                            style={tw`flex-row justify-between items-center mb-4 min-h-10`}
                          >
                            {renderSectionHeader(
                              t("orders:details.pendingItems"),
                              pendingDetails.length,
                            )}
                            {canMarkDelivered &&
                              !deliverInBar &&
                              !isSelectionMode && (
                                <Button
                                  variant="text"
                                  size="small"
                                  leftIcon="check-check"
                                  label={t("orders:details.deliverAll")}
                                  onPress={() => markDelivered(order)}
                                />
                              )}
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

                      {/* Delivered Items Section (for active orders) */}
                      {!isClosed && deliveredDetails.length > 0 && (
                        <ThemedView style={tw`mb-6`}>
                          <ThemedView style={tw`mb-4`}>
                            {renderSectionHeader(
                              t("orders:details.deliveredItems"),
                              deliveredDetails.length,
                            )}
                          </ThemedView>
                          <ThemedView style={tw`gap-6`}>
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
                        </ThemedView>
                      )}

                      {/* Cancelled Items Section */}
                      {cancelledDetails.length > 0 && (
                        <ThemedView style={tw`mb-6`}>
                          <Pressable
                            onPress={toggleCancelledSection}
                            accessibilityRole="button"
                            accessibilityState={{
                              expanded: isCancelledExpanded,
                            }}
                            style={tw`flex-row justify-between items-center min-h-12`}
                          >
                            {renderSectionHeader(
                              t("orders:details.cancelledItems"),
                              cancelledDetails.length,
                            )}
                            <Icon
                              name={
                                isCancelledExpanded
                                  ? "chevron-up"
                                  : "chevron-down"
                              }
                              size={20}
                              color={tw.color("gray-500")}
                            />
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
                          <ThemedView style={tw`mb-4`}>
                            {renderSectionHeader(
                              t("orders:details.allItems"),
                              allDetails.length,
                            )}
                          </ThemedView>
                          <ThemedView style={tw`gap-6`}>
                            {allDetails.map((detail) => (
                              <OrderDetailCard
                                key={detail.id}
                                detail={detail}
                                onPress={() => {}} // No action for closed orders
                                orderUserId={order.user?.id || ""}
                                orderType={order.type}
                                readOnly
                              />
                            ))}
                          </ThemedView>
                        </ThemedView>
                      )}

                      {/* Empty state for orders with no items */}
                      {!hasItems && (
                        <ThemedView
                          style={tw`mb-6 p-8 items-center justify-center`}
                        >
                          <Icon
                            name="file"
                            size={48}
                            color={tw.color("gray-400")}
                          />
                          <ThemedText
                            type="body1"
                            style={tw`text-gray-500 mt-4 text-center`}
                          >
                            {t("orders:details.noItemsInOrder")}
                          </ThemedText>
                        </ThemedView>
                      )}
                    </ThemedView>
                  )}

                  {tab === "bills" && (
                    <OrderBillsTab order={order} scrollable={false} />
                  )}
                  {tab === "tickets" && (
                    <OrderTicketsTab order={order} scrollable={false} />
                  )}
                </>
              )}
            />
          </Animated.ScrollView>
        </Container>

        {/* Bottom bar: the order's next step, or the bulk-deliver bar while
            selecting */}
        {(isSelectionMode || hasBarAction) && (
          <ThemedView
            style={[
              tw`px-4 pt-3 border-t border-divider bg-background`,
              { paddingBottom: embedded ? 16 : Math.max(insets.bottom, 16) },
            ]}
          >
            {isSelectionMode ? (
              <ThemedView style={tw`flex-row items-center gap-1`}>
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
                  size="small"
                  leftIcon="check-check"
                  label={t("orders:details.selection.deliver")}
                  disabled={selectedDetails.length === 0}
                  onPress={deliverSelected}
                />
              </ThemedView>
            ) : (
              <ThemedView style={tw`flex-row gap-3 justify-center`}>
                {chargeAction && (
                  <Button
                    label={t("orders:details.chargeAmount", {
                      amount: formatCurrency(chargeAction.amount),
                    })}
                    onPress={chargeAction.onPress}
                    style={tw``}
                    shape="rounded"
                  />
                )}
                {deliverInBar && (
                  <Button
                    leftIcon="check-check"
                    label={t("orders:options.markDelivered")}
                    onPress={() => markDelivered(order)}
                    style={tw``}
                    shape="rounded"
                  />
                )}
                {closeInBar && (
                  <Button
                    leftIcon="lock"
                    label={t("orders:options.closeOrder")}
                    onPress={openCloseModal}
                    style={tw``}
                    shape="rounded"
                  />
                )}
              </ThemedView>
            )}
          </ThemedView>
        )}
      </ThemedView>

      <ThemedBottomSheetModal ref={editBottomSheetRef} enablePanDownToClose>
        {order && (
          <EditOrderBottomSheet
            order={order}
            onOrderUpdated={closeEditBottomSheet}
            onTypeChange={handleEditTypeChange}
            canChangeType={order.status !== OrderStatus.DELIVERED}
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

      <PeopleBottomSheet
        ref={peopleSheetRef}
        value={order.people}
        onDone={handlePeopleChange}
      />

      <DeliveryTimeBottomSheet
        ref={deliveryTimeSheetRef}
        value={deliveryTime?.toDate() ?? null}
        onChange={handleDeliveryTimeChange}
        clearable={false}
      />

      <TableSelectorBottomSheet
        ref={tableSelectorBottomSheetRef}
        selectedTableId={order.table?.id}
        onSelectTable={(selected) => {
          if (selected.id === order.table?.id) return;
          updateOrder({ id: order.id, tableId: selected.id });
        }}
      />

      <TableSelectorBottomSheet
        ref={typeTableSelectorRef}
        onSelectTable={(selected) =>
          startTypeChange({
            id: order.id,
            typeOrder: OrderType.IN_PLACE,
            tableId: selected.id,
          })
        }
      />

      <ChangeItemsTypeBottomSheet
        ref={changeItemsTypeSheetRef}
        onConfirm={handleConfirmItemsType}
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
                color: "text-red-600",
              })),
            },
          ]}
        />
      </ThemedBottomSheetModal>

      {deleteBlockReason && (
        <InfoBottomSheet
          ref={deleteBlockedSheetRef}
          title={t("orders:deleteBlocked.title")}
          message={t(`orders:deleteBlocked.reasons.${deleteBlockReason}`)}
        />
      )}
    </>
  );
}
