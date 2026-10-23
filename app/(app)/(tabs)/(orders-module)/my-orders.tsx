import {
  ScrollView,
  RefreshControl,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";

import Fab from "@/presentation/theme/components/fab";
import Icon from "@/presentation/theme/components/icon";
import tw from "@/presentation/theme/lib/tailwind";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import useOrdersModuleContext from "./orders-module.context";
import * as Haptics from "expo-haptics";
import NewOrderBottomSheet from "@/presentation/orders/new-order-bottom-sheet";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useActiveOrders } from "@/presentation/orders/hooks/useActiveOrders";
import Popover, {
  AnchorPosition,
} from "@/presentation/theme/components/popover";
import OrderListByStatus from "@/presentation/orders/molecules/order-list-by-status";
import OrderCardSkeleton from "@/presentation/home/components/order-card-skeleton";
import TablesView from "@/presentation/tables/components/tables-view";
import TableActionsBottomSheet from "@/presentation/tables/components/table-actions-bottom-sheet";
import { Table } from "@/core/tables/models/table.model";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { Order } from "@/core/orders/models/order.model";
import { MyOrdersHeaderRight } from "../_layout";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import SalesContent from "@/presentation/orders/components/sales-content";
// import IconButton from "@/presentation/theme/components/icon-button";
import Button from "@/presentation/theme/components/button";
import ButtonGroup from "@/presentation/theme/components/button-group";
import TabBar from "@/presentation/theme/components/tab-bar";
import HomeViewOptionsBottomSheet from "@/presentation/orders/components/home-view-options-bottom-sheet";
import { useScopedOrders } from "@/presentation/orders/hooks/useScopedOrders";
import { useOrdersViewStore } from "@/presentation/orders/store/useOrdersViewStore";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import {
  selectDraftDetails,
  useNewOrderStore,
} from "@/presentation/orders/store/newOrderStore";
import { OrderPaneContext } from "@/presentation/orders/context/order-pane.context";
import OrderDetailView from "@/presentation/orders/components/order-detail-view";
import BillDetailView from "@/presentation/orders/components/bill-detail-view";
import ClosePaidOrdersButton from "@/presentation/orders/components/close-paid-orders-button";

const ORDERS_LIST_PANE_WIDTH = 440;

export default function MyOrdersScreen() {
  const { t } = useTranslation([
    "common",
    "orders",
    "errors",
    "tables",
    "bills",
  ]);
  const byDeliveryTime = (a: Order, b: Order) =>
    (a.deliveryTime ? new Date(a.deliveryTime).getTime() : Infinity) -
    (b.deliveryTime ? new Date(b.deliveryTime).getTime() : Infinity);

  const orders = useScopedOrders().slice().sort(byDeliveryTime);
  const allOrders = useOrdersStore((state) => state.orders);
  const ordersScope = useOrdersViewStore((state) => state.ordersScope);
  const setOrdersScope = useOrdersViewStore((state) => state.setOrdersScope);
  const router = useRouter();
  const params = useLocalSearchParams<{ module?: "orders" | "sales" }>();
  const [refreshing, setRefreshing] = useState(false);
  const [activeModule, setActiveModule] = useState<"orders" | "sales">(
    params.module === "sales" ? "sales" : "orders",
  );
  const [activeView, setActiveView] = useState<
    "tables" | "take-away" | "list" | "cards"
  >("tables");
  const takeAwayOrders = orders.filter(
    (order) => order.type === OrderType.TAKE_AWAY,
  );
  const listOrders = activeView === "take-away" ? takeAwayOrders : orders;
  const [selectedView, setSelectedView] = useState<
    "pending-products" | "order-lists"
  >("pending-products");
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [popoverAnchor, setPopoverAnchor] = useState<AnchorPosition | null>(
    null,
  );
  const primaryColor = useThemeColor({}, "primary");
  const { registerOpenViewPopover } = useOrdersModuleContext();
  const { isLoading: isLoadingOrders, refetchOrders } = useActiveOrders();

  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // Tablet landscape: list on the left, the selected order or sale (bill) on
  // the right
  const { isExpanded } = useResponsiveLayout();
  const showOrderPane = isExpanded && activeModule === "orders";
  const activeOrder = useOrdersStore((state) => state.activeOrder);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);

  const hasDraftOrder =
    useNewOrderStore(selectDraftDetails("order")).length > 0;
  const openDraft = useNewOrderStore((state) => state.openDraft);

  const [fabExpanded, setFabExpanded] = useState(true);
  const lastScrollY = useRef(0);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentY = event.nativeEvent.contentOffset.y;
      const diff = currentY - lastScrollY.current;
      const SCROLL_THRESHOLD = 10;

      if (Math.abs(diff) > SCROLL_THRESHOLD) {
        setFabExpanded(diff < 0 || currentY <= 0);
        lastScrollY.current = currentY;
      }
    },
    [],
  );

  useEffect(() => {
    registerOpenViewPopover((anchor) => {
      setPopoverAnchor(anchor);
      setPopoverVisible(true);
    });
  }, []);

  // ref
  const bottomSheetModalRef = useRef<BottomSheetMethods>(null);
  const tableSheetRef = useRef<BottomSheetMethods>(null);
  const viewOptionsSheetRef = useRef<BottomSheetMethods>(null);

  const handleNavigate = () => {
    bottomSheetModalRef.current?.close();
    router.push("/(new-order)/restaurant-menu");
  };

  const handleTableOrderNavigate = () => {
    tableSheetRef.current?.close();
    router.push("/(new-order)/restaurant-menu");
  };

  // callbacks
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleResumeOrder = useCallback(() => {
    openDraft("order");
    router.push("/(new-order)/restaurant-menu");
  }, [openDraft, router]);

  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await refetchOrders();
    } catch {
      Alert.alert(
        t("errors:order.fetchError"),
        t("errors:order.ordersFetchFailed"),
      );
    } finally {
      setRefreshing(false);
    }
  }, [refetchOrders, t]);

  const handleTablePress = (table: Table) => {
    // The tables view ignores the orders scope
    const tableOrders = allOrders.filter(
      (order) => order.table?.id === table.id,
    );
    const tableHasOrders = tableOrders.length > 0;

    // Tablet: a table with a single order opens it straight in the pane
    if (showOrderPane && tableOrders.length === 1) {
      setActiveOrder(tableOrders[0]);
      return;
    }

    if (tableHasOrders) {
      router.push({
        pathname: "/(tables)/[tableId]",
        params: { tableId: table.id, tableName: table.name },
      });
    } else {
      setSelectedTable(table);
      tableSheetRef.current?.present();
    }
  };

  const moduleTabs = [
    {
      label: t("common:navigation.orders"),
      value: "orders" as const,
    },
    {
      label: t("common:navigation.sales"),
      value: "sales" as const,
    },
  ];

  const viewOptions = [
    {
      label: t("tables:list.title"),
      value: "tables" as const,
      icon: "layout-grid" as const,
    },
    {
      label: t("orders:details.takeAway"),
      value: "take-away" as const,
      icon: "handbag" as const,
    },
    {
      label: t("orders:homeViews.list"),
      value: "list" as const,
      icon: "list" as const,
    },
    {
      label: t("orders:homeViews.cards"),
      value: "cards" as const,
      icon: "gallery-vertical-end" as const,
    },
  ];
  const currentView =
    viewOptions.find((option) => option.value === activeView) ?? viewOptions[0];

  const scopeOptions = [
    {
      label: t("orders:drawer.myOrders"),
      value: "my-orders" as const,
      icon: "user" as const,
    },
    {
      label: t("orders:drawer.allOrders"),
      value: "all-orders" as const,
      icon: "users" as const,
    },
  ];

  const handleViewTogglePress = () => {
    const currentIndex = viewOptions.findIndex(
      (option) => option.value === activeView,
    );
    setActiveView(viewOptions[(currentIndex + 1) % viewOptions.length].value);
  };

  const listPane = (
    <ThemedView
      style={[
        tw`bg-background`,
        isExpanded ? { width: ORDERS_LIST_PANE_WIDTH } : tw`flex-1`,
      ]}
    >
      {/* Fixed header with module toggle */}
      <ThemedView style={tw`px-4  `}>
        <ThemedView style={tw`flex-row items-center justify-between pt-8 mb-2`}>
          <ThemedView style={tw`flex-1 mr-3`}>
            <TabBar
              tabs={moduleTabs}
              activeTab={activeModule}
              onChange={setActiveModule}
              fullWidth={false}
              textType="h3"
            />
          </ThemedView>
          <MyOrdersHeaderRight
            cart={activeModule === "sales" ? "sale" : "order"}
          />
        </ThemedView>
        {activeModule === "orders" && (
          <ThemedView style={tw` flex-row items-center justify-end gap-2 `}>
            {activeView !== "tables" && (
              <ButtonGroup
                size="small"
                iconOnly
                options={scopeOptions}
                selected={ordersScope}
                onChange={setOrdersScope}
              />
            )}
            <Button
              variant="surface"
              size="small"
              label={currentView.label}
              leftIcon={currentView.icon}
              onPress={handleViewTogglePress}
            />
            {/* Customize view button hidden for now; the scope is switched */}
            {/* with the button group above instead. */}
            {/* <IconButton */}
            {/*   icon="options-outline" */}
            {/*   accessibilityLabel={t("orders:homeOptions.title")} */}
            {/*   onPress={() => viewOptionsSheetRef.current?.present()} */}
            {/* /> */}
          </ThemedView>
        )}
      </ThemedView>

      {activeModule === "sales" && (
        <ThemedView style={tw`flex-1`}>
          <SalesContent
            activeBillId={
              isExpanded ? (selectedBillId ?? undefined) : undefined
            }
            onOpenBill={
              isExpanded ? (bill) => setSelectedBillId(bill.id) : undefined
            }
          />
        </ThemedView>
      )}

      {/* Tab content */}
      {activeModule === "orders" && (
        <>
          <ThemedView style={tw`flex-1`}>
            {activeView !== "tables" && (
              <ScrollView
                contentContainerStyle={tw`grow pb-20 gap-4 pt-4`}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={primaryColor}
                    colors={[primaryColor]}
                  />
                }
              >
                {isLoadingOrders ? (
                  <ThemedView style={tw`px-4 gap-3`}>
                    <OrderCardSkeleton />
                    <OrderCardSkeleton />
                    <OrderCardSkeleton />
                  </ThemedView>
                ) : listOrders.length === 0 ? (
                  <ThemedView
                    style={tw` items-center justify-center flex-1 gap-4 mt-20`}
                  >
                    <Icon
                      name="file-text"
                      size={80}
                      color={tw.color("gray-500")}
                    />
                    <ThemedText type="h3">
                      {t("orders:list.noOrders")}
                    </ThemedText>
                    <ThemedText type="body2" style={tw`text-center max-w-xs`}>
                      {t("orders:list.noOrdersDescription")}
                    </ThemedText>
                  </ThemedView>
                ) : (
                  <ThemedView style={tw`gap-6`}>
                    <OrderListByStatus
                      key={activeView}
                      orders={listOrders}
                      showProducts
                      variant={activeView === "cards" ? "grid" : "list"}
                    />
                  </ThemedView>
                )}
                {/* Pushed to the bottom on short lists, clear of the FAB */}
                {!isLoadingOrders && (
                  <ThemedView style={tw`mt-auto`}>
                    <ClosePaidOrdersButton />
                  </ThemedView>
                )}
              </ScrollView>
            )}

            {activeView === "tables" && (
              <TablesView
                onTablePress={handleTablePress}
                style={tw`flex-1`}
                footer={<ClosePaidOrdersButton />}
              />
            )}
          </ThemedView>

          <ThemedBottomSheetModal
            ref={bottomSheetModalRef}
            onChange={handleSheetChanges}
            enablePanDownToClose
          >
            <NewOrderBottomSheet onCreateOrder={handleNavigate} />
          </ThemedBottomSheetModal>
          <ThemedBottomSheetModal ref={tableSheetRef} enablePanDownToClose>
            {selectedTable && (
              <TableActionsBottomSheet
                table={selectedTable}
                onCreateOrder={handleTableOrderNavigate}
              />
            )}
          </ThemedBottomSheetModal>
          <ThemedBottomSheetModal
            ref={viewOptionsSheetRef}
            enablePanDownToClose
          >
            <HomeViewOptionsBottomSheet />
          </ThemedBottomSheetModal>
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
                icon: "layout-grid",
                onPress: () => setSelectedView("pending-products"),
              },
              {
                label: t("orders:views.orders"),
                value: "order-lists",
                icon: "list",
                onPress: () => setSelectedView("order-lists"),
              },
            ]}
          />
          <Fab
            icon={hasDraftOrder ? "shopping-cart" : "plus"}
            label={
              hasDraftOrder
                ? t("orders:actions.resumeOrder")
                : t("orders:actions.newOrder")
            }
            expanded={fabExpanded}
            onPress={
              hasDraftOrder ? handleResumeOrder : handlePresentModalPress
            }
          />
        </>
      )}
    </ThemedView>
  );

  if (!isExpanded) return listPane;

  const emptyPane = (title: string, description: string) => (
    <ThemedView style={tw`flex-1 items-center justify-center gap-4 px-8`}>
      <Icon name="receipt-text" size={64} color={tw.color("gray-400")} />
      <ThemedText type="h3">{title}</ThemedText>
      <ThemedText type="body2" style={tw`text-center max-w-xs`}>
        {description}
      </ThemedText>
    </ThemedView>
  );

  return (
    <ThemedView style={tw`flex-1 flex-row bg-background`}>
      <OrderPaneContext.Provider value={true}>
        {listPane}
      </OrderPaneContext.Provider>
      <ThemedView style={tw`flex-1 border-l border-outline-variant`}>
        {activeModule === "sales" ? (
          selectedBillId != null ? (
            <BillDetailView
              key={selectedBillId}
              billId={selectedBillId}
              embedded
              onClose={() => setSelectedBillId(null)}
            />
          ) : (
            emptyPane(
              t("bills:pane.emptyTitle"),
              t("bills:pane.emptyDescription"),
            )
          )
        ) : activeOrder ? (
          // Remount per order so per-order view state (tabs, selection) resets
          <OrderDetailView key={activeOrder.id} embedded />
        ) : (
          emptyPane(
            t("orders:pane.emptyTitle"),
            t("orders:pane.emptyDescription"),
          )
        )}
      </ThemedView>
    </ThemedView>
  );
}
