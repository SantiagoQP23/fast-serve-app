import Animated from "react-native-reanimated";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import Fab from "@/presentation/theme/components/fab";
import { useTableOrders } from "@/presentation/orders/hooks/useTableOrders";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { useCallback, useEffect, useRef } from "react";

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
import { useTableStatus } from "@/presentation/tables/hooks/useTableStatus";

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

  const { totalAmount, activeOrdersCount, hasOrders, orders } = useTableOrders(
    tableId!,
  );

  const { isOccupied } = useTableStatus(tableId!);

  const { setTable, setOrderType } = useNewOrderStore();

  const title = t("tables:details.table", { name: tableName });
  const statusText = isOccupied
    ? t("common:status.occupied")
    : t("common:status.available");

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
              <Icon
                name="utensils"
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
      </ScreenLayout>
      <Fab icon="plus" onPress={handlePresentModalPress} />
    </>
  );
}
