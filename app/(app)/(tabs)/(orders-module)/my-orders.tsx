import { ScrollView, RefreshControl, Alert } from "react-native";

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
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useQueryClient } from "@tanstack/react-query";
import { useActiveOrders } from "@/presentation/orders/hooks/useActiveOrders";
import Popover, {
  AnchorPosition,
} from "@/presentation/theme/components/popover";
import OrderListByStatus from "@/presentation/orders/molecules/order-list-by-status";
import OrderCardSkeleton from "@/presentation/home/components/order-card-skeleton";
import TabBar from "@/presentation/theme/components/tab-bar";
import TablesView from "@/presentation/tables/components/tables-view";
import { Table } from "@/core/tables/models/table.model";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { OrderType } from "@/core/orders/enums/order-type.enum";

export default function MyOrdersScreen() {
  const { t } = useTranslation(["common", "orders", "errors", "tables"]);
  const { user } = useAuthStore();
  const allOrders = useOrdersStore((state) => state.orders);
  const orders = allOrders.filter((order) => order.user.id === user?.id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentRestaurant } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "my-orders" | "all-orders" | "tables"
  >("my-orders");
  const [selectedView, setSelectedView] = useState<
    "pending-products" | "order-lists"
  >("pending-products");
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [popoverAnchor, setPopoverAnchor] = useState<AnchorPosition | null>(
    null,
  );
  const primaryColor = useThemeColor({}, "primary");
  const { registerOpenViewPopover } = useOrdersModuleContext();
  const { isLoading: isLoadingOrders } = useActiveOrders({
    skipGlobalLoader: true,
  });

  const { setTable, setOrderType } = useNewOrderStore();

  useEffect(() => {
    registerOpenViewPopover((anchor) => {
      setPopoverAnchor(anchor);
      setPopoverVisible(true);
    });
  }, []);

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
      ]);
    } catch {
      Alert.alert(
        t("errors:order.fetchError"),
        t("errors:order.ordersFetchFailed"),
      );
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, currentRestaurant?.id, t]);

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

  const tabs = [
    {
      label: t("orders:drawer.myOrders"),
      value: "my-orders" as const,
      icon: "person-outline" as const,
      count: orders.length,
    },
    {
      label: t("orders:drawer.allOrders"),
      value: "all-orders" as const,
      icon: "people-outline" as const,
      count: allOrders.length,
    },
    {
      label: t("tables:list.title"),
      value: "tables" as const,
      icon: "grid-outline" as const,
    },
  ];

  return (
    <ThemedView style={tw`flex-1 bg-light-background`}>
      {/* Fixed header with greeting and tabs */}
      <ThemedView style={tw`px-4 pt-4`}>
        <ThemedText type="body1">{t("common:greetings.hello")},</ThemedText>
        <ThemedText type="h2" style={tw`mt-1`}>
          {user?.person.firstName}!
        </ThemedText>
        <ThemedView style={tw`mt-4 mb-2`}>
          <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </ThemedView>
      </ThemedView>

      {/* Tab content */}
      <ThemedView style={tw`flex-1`}>
        {activeTab === "my-orders" && (
          <ScrollView
            contentContainerStyle={tw`pb-20 gap-4 pt-4`}
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
            {isLoadingOrders ? (
              <ThemedView style={tw`px-4 gap-3`}>
                <OrderCardSkeleton />
                <OrderCardSkeleton />
                <OrderCardSkeleton />
              </ThemedView>
            ) : orders.length === 0 ? (
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
                <OrderListByStatus orders={orders} showProducts />
              </ThemedView>
            )}
          </ScrollView>
        )}

        {activeTab === "all-orders" && (
          <ScrollView
            contentContainerStyle={tw`pb-20 gap-4 pt-4`}
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
            {isLoadingOrders ? (
              <ThemedView style={tw`px-4 gap-3`}>
                <OrderCardSkeleton />
                <OrderCardSkeleton />
                <OrderCardSkeleton />
              </ThemedView>
            ) : allOrders.length === 0 ? (
              <ThemedView
                style={tw`items-center justify-center flex-1 gap-4 mt-20`}
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
                <OrderListByStatus orders={allOrders} showProducts />
              </ThemedView>
            )}
          </ScrollView>
        )}

        {activeTab === "tables" && (
          <TablesView onTablePress={handleTablePress} style={tw`flex-1`} />
        )}
      </ThemedView>

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
