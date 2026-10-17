import Animated from "react-native-reanimated";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import Fab from "@/presentation/theme/components/fab";
import { useTableOrders } from "@/presentation/orders/hooks/useTableOrders";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { useCallback, useContext, useEffect, useRef } from "react";
import { toast } from "sonner-native";

import NewOrderBottomSheet from "@/presentation/orders/new-order-bottom-sheet";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import Label from "@/presentation/theme/components/label";
import StatsCard from "@/presentation/home/components/stats-card";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import OrderListByStatus from "@/presentation/orders/molecules/order-list-by-status";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import {
  CollapsibleHeaderTitle,
  CollapsibleLargeTitle,
  useCollapsibleHeaderScroll,
} from "@/presentation/theme/components/collapsible-header-title";
import ActionsBottomSheet from "@/presentation/theme/components/actions-bottom-sheet";
import { useTableStatus } from "@/presentation/tables/hooks/useTableStatus";
import { useTablesManagement } from "@/presentation/tables/hooks/useTablesManagement";
import { SocketContext } from "@/presentation/shared/context/SocketContext";

export default function TableOrdersScreen() {
  const { t } = useTranslation(["common", "tables"]);
  const { tableId, tableName } = useLocalSearchParams<{
    tableId: string;
    tableName: string;
  }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { scrollY, scrollHandler } = useCollapsibleHeaderScroll();
  const bottomSheetModalRef = useRef<BottomSheetMethods>(null);
  const statusSheetRef = useRef<BottomSheetMethods>(null);
  const { online } = useContext(SocketContext);

  const { totalAmount, activeOrdersCount, hasOrders, orders } = useTableOrders(
    tableId!,
  );

  const { hasOpenOrders, isOccupied } = useTableStatus(tableId!);
  const { setTableAvailability } = useTablesManagement();

  const { setTable, setOrderType } = useNewOrderStore();

  const title = t("tables:details.table", { name: tableName });
  const statusText = isOccupied
    ? t("common:status.occupied")
    : t("common:status.available");

  const handleOpenStatusSheet = () => {
    if (!online) {
      toast.info(t("tables:details.status.offline"));
      return;
    }
    statusSheetRef.current?.present();
  };

  const handleChangeStatus = (isAvailable: boolean) => {
    statusSheetRef.current?.close();
    if (isAvailable === !isOccupied) return;
    setTableAvailability.mutate({ id: tableId!, isAvailable });
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <CollapsibleHeaderTitle
          scrollY={scrollY}
          title={title}
          subtitle={statusText}
        />
      ),
    });
  }, [navigation, scrollY, title, statusText]);

  const handleNavigate = () => {
    bottomSheetModalRef.current?.close();
    router.push("/(new-order)/restaurant-menu");
  };

  const handlePresentModalPress = useCallback(() => {
    // Set the table info for new order
    setTable({ id: tableId!, name: tableName!, isAvailable: false });
    setOrderType(OrderType.IN_PLACE);
    bottomSheetModalRef.current?.present();
  }, [tableId, tableName, setTable, setOrderType]);

  return (
    <>
      <ScreenLayout style={tw`flex-1`}>
        <Animated.ScrollView
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`pb-20 gap-4 flex-grow`}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          <ThemedView style={tw`px-4 mt-2`}>
            <CollapsibleLargeTitle
              scrollY={scrollY}
              title={title}
              subtitle={
                <ThemedView style={tw`flex-row`}>
                  <Label
                    text={statusText}
                    color={isOccupied ? "error" : "success"}
                    variant="soft"
                    rightIcon="chevron-down"
                    disabled={setTableAvailability.isPending}
                    onPress={handleOpenStatusSheet}
                    accessibilityLabel={t("tables:details.status.change")}
                  />
                </ThemedView>
              }
            />
          </ThemedView>
          {/* <ThemedView style={tw`px-4 flex-row items-center gap-4`}> */}
          {/*   <StatsCard */}
          {/*     title={t("tables:totalOrders")} */}
          {/*     value={activeOrdersCount} */}
          {/*     icon="receipt-outline" */}
          {/*   /> */}
          {/*   <StatsCard */}
          {/*     title={t("tables:totalRevenue")} */}
          {/*     value={formatCurrency(totalAmount)} */}
          {/*     icon="cash-outline" */}
          {/*   /> */}
          {/* </ThemedView> */}

          {!hasOrders ? (
            <ThemedView style={tw`items-center justify-center flex-1 gap-4`}>
              <Ionicons
                name="restaurant-outline"
                size={80}
                color={tw.color("gray-500")}
              />
              <ThemedText type="h3">{t("tables:details.noOrders")}</ThemedText>
              <ThemedText type="body2" style={tw`text-center max-w-xs`}>
                {t("tables:details.noOrdersDescription")}
              </ThemedText>
            </ThemedView>
          ) : (
            <OrderListByStatus orders={orders} showProducts />
          )}
        </Animated.ScrollView>

        <ThemedBottomSheetModal ref={bottomSheetModalRef} enablePanDownToClose>
          <NewOrderBottomSheet onCreateOrder={handleNavigate} />
        </ThemedBottomSheetModal>

        <ThemedBottomSheetModal ref={statusSheetRef} enablePanDownToClose>
          <ActionsBottomSheet
            title={t("tables:details.status.title")}
            subtitle={
              hasOpenOrders ? t("tables:details.status.hasOrders") : undefined
            }
            items={[
              {
                icon: isOccupied ? "ellipse-outline" : "checkmark-circle",
                label: t("common:status.available"),
                color: "text-green-600",
                disabled: hasOpenOrders,
                onPress: () => handleChangeStatus(true),
              },
              {
                icon: isOccupied ? "checkmark-circle" : "ellipse-outline",
                label: t("common:status.occupied"),
                color: "text-red-600",
                onPress: () => handleChangeStatus(false),
              },
            ]}
          />
        </ThemedBottomSheetModal>
      </ScreenLayout>
      <Fab icon="add-outline" onPress={handlePresentModalPress} />
    </>
  );
}
