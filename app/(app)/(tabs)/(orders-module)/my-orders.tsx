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
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import useOrdersModuleContext from "./orders-module.context";
import * as Haptics from "expo-haptics";
import NewOrderBottomSheet from "@/presentation/orders/new-order-bottom-sheet";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useActiveOrders } from "@/presentation/orders/hooks/useActiveOrders";
import Popover, {
  AnchorPosition,
} from "@/presentation/theme/components/popover";
import OrderListByStatus from "@/presentation/orders/molecules/order-list-by-status";
import OrderCardSkeleton from "@/presentation/home/components/order-card-skeleton";
import SegmentedControl from "@/presentation/theme/components/segmented-control";
import TablesView from "@/presentation/tables/components/tables-view";
import { Table } from "@/core/tables/models/table.model";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { Order } from "@/core/orders/models/order.model";
import { MyOrdersHeaderRight } from "../_layout";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { useSyncStore } from "@/presentation/sync/store/useSyncStore";
import SalesContent from "@/presentation/orders/components/sales-content";
import IconButton from "@/presentation/theme/components/icon-button";
import Button from "@/presentation/theme/components/button";
import HomeViewOptionsBottomSheet, {
  OrdersScope,
} from "@/presentation/orders/components/home-view-options-bottom-sheet";

export default function MyOrdersScreen() {
  const { t } = useTranslation(["common", "orders", "errors", "tables"]);
  const { user } = useAuthStore();
  const lastSequence = useSyncStore((state) => state.lastSequence);
  const byDeliveryTime = (a: Order, b: Order) =>
    (a.deliveryTime ? new Date(a.deliveryTime).getTime() : Infinity) -
    (b.deliveryTime ? new Date(b.deliveryTime).getTime() : Infinity);

  const allOrders = useOrdersStore((state) => state.orders)
    .slice()
    .sort(byDeliveryTime);
  const router = useRouter();
  const params = useLocalSearchParams<{ module?: "orders" | "sales" }>();
  const [refreshing, setRefreshing] = useState(false);
  const [activeModule, setActiveModule] = useState<"orders" | "sales">(
    params.module === "sales" ? "sales" : "orders",
  );
  const [activeView, setActiveView] = useState<"tables" | "take-away">(
    "tables",
  );
  const [ordersScope, setOrdersScope] = useState<OrdersScope>("my-orders");
  const takeAwayOrders = allOrders.filter(
    (order) =>
      order.type === OrderType.TAKE_AWAY &&
      (ordersScope === "all-orders" || order.user?.id === user?.id),
  );
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

  const { setTable, setOrderType } = useNewOrderStore();

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
  const viewOptionsSheetRef = useRef<BottomSheetMethods>(null);

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
    const tableHasOrders = allOrders.some(
      (order) => order.table?.id === table.id,
    );

    if (tableHasOrders) {
      router.push({
        pathname: "/(tables)/[tableId]",
        params: { tableId: table.id, tableName: table.name },
      });
    } else {
      setTable(table);
      setOrderType(OrderType.IN_PLACE);
      bottomSheetModalRef.current?.present();
    }
  };

  const moduleTabs = [
    {
      label: t("common:navigation.orders"),
      value: "orders" as const,
      icon: "list-outline" as const,
    },
    {
      label: t("common:navigation.sales"),
      value: "sales" as const,
      icon: "pricetag-outline" as const,
    },
  ];

  const currentView =
    activeView === "tables"
      ? { label: t("tables:list.title"), icon: "grid-outline" as const }
      : {
          label: t("orders:details.takeAway"),
          icon: "bag-handle-outline" as const,
        };

  return (
    <ThemedView style={tw`flex-1 bg-light-background`}>
      {/* Fixed header with module toggle */}
      <ThemedView style={tw`px-4  `}>
        <ThemedView style={tw`flex-row items-center justify-between pt-8 mb-2`}>
          <ThemedView style={tw`flex-1 mr-3`}>
            <SegmentedControl
              items={moduleTabs}
              value={activeModule}
              onChange={setActiveModule}
            />
          </ThemedView>
          <MyOrdersHeaderRight />
        </ThemedView>
        {activeModule === "orders" && (
          <ThemedView style={tw`mt-4 flex-row items-center justify-end gap-2 `}>
            <Button
              variant="surface"
              size="small"
              label={currentView.label}
              leftIcon={currentView.icon}
              onPress={() =>
                setActiveView((view) =>
                  view === "tables" ? "take-away" : "tables",
                )
              }
            />
            <IconButton
              icon="options-outline"
              accessibilityLabel={t("orders:homeOptions.title")}
              onPress={() => viewOptionsSheetRef.current?.present()}
            />
          </ThemedView>
        )}
      </ThemedView>

      {activeModule === "sales" && (
        <ThemedView style={tw`flex-1`}>
          <SalesContent />
        </ThemedView>
      )}

      {/* Tab content */}
      {activeModule === "orders" && (
        <>
          <ThemedView style={tw`flex-1`}>
            {activeView === "take-away" && (
              <ScrollView
                contentContainerStyle={tw`pb-20 gap-4 pt-4`}
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
                ) : takeAwayOrders.length === 0 ? (
                  <ThemedView
                    style={tw` items-center justify-center flex-1 gap-4 mt-20`}
                  >
                    <Ionicons
                      name="document-text-outline"
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
                    <OrderListByStatus orders={takeAwayOrders} showProducts />
                  </ThemedView>
                )}
              </ScrollView>
            )}

            {activeView === "tables" && (
              <TablesView onTablePress={handleTablePress} style={tw`flex-1`} />
            )}
          </ThemedView>

          <ThemedBottomSheetModal
            ref={bottomSheetModalRef}
            onChange={handleSheetChanges}
            enablePanDownToClose
          >
            <NewOrderBottomSheet onCreateOrder={handleNavigate} />
          </ThemedBottomSheetModal>
          <ThemedBottomSheetModal
            ref={viewOptionsSheetRef}
            enablePanDownToClose
          >
            <HomeViewOptionsBottomSheet
              ordersScope={ordersScope}
              onOrdersScopeChange={setOrdersScope}
            />
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
          <Fab
            icon="add-outline"
            label={t("orders:actions.newOrder")}
            expanded={fabExpanded}
            onPress={handlePresentModalPress}
          />
        </>
      )}
    </ThemedView>
  );
}
