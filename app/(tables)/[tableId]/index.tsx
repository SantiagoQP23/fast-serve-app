import { ScrollView, View } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Fab from "@/presentation/theme/components/fab";
import OrderList from "@/presentation/orders/molecules/order-list";
import { useTableOrders } from "@/presentation/orders/hooks/useTableOrders";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { useCallback, useRef } from "react";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import NewOrderBottomSheet from "@/presentation/orders/new-order-bottom-sheet";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import Label from "@/presentation/theme/components/label";
import StatsCard from "@/presentation/home/components/stats-card";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import OrderListByStatus from "@/presentation/orders/molecules/order-list-by-status";

export default function TableOrdersScreen() {
  const { t } = useTranslation(["common", "tables"]);
  const { tableId, tableName } = useLocalSearchParams<{
    tableId: string;
    tableName: string;
  }>();
  const router = useRouter();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const {
    pendingOrders,
    inProgressOrders,
    deliveredOrders,
    totalAmount,
    activeOrdersCount,
    hasOrders,
  } = useTableOrders(tableId!);

  const { setTable, setOrderType } = useNewOrderStore();

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
        <ThemedView
          style={tw`mb-6 px-4 mt-2 flex-row items-center justify-between`}
        >
          <ThemedText type="h2">
            {t("tables:details.table", { name: tableName })}
          </ThemedText>
          <ThemedView style={tw`flex-row items-center  gap-4`}>
            <ThemedView style={tw`flex-row items-center gap-2`}>
              <Label
                text={
                  hasOrders
                    ? t("common:status.occupied")
                    : t("common:status.available")
                }
                color={hasOrders ? "error" : "success"}
              />
            </ThemedView>
          </ThemedView>
        </ThemedView>
        <ThemedView style={tw`px-4 mb-4 flex-row items-center gap-4`}>
          <StatsCard
            title={t("tables:totalOrders")}
            value={activeOrdersCount}
            icon="receipt-outline"
          />
          <StatsCard
            title={t("tables:totalRevenue")}
            value={formatCurrency(totalAmount)}
            icon="cash-outline"
          />
        </ThemedView>

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
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={tw`pb-20 gap-4`}
          >
            <OrderListByStatus
              orders={[
                ...pendingOrders,
                ...inProgressOrders,
                ...deliveredOrders,
              ]}
            />
          </ScrollView>
        )}

        <BottomSheetModal
          ref={bottomSheetModalRef}
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
      </ScreenLayout>
      <Fab icon="add-outline" onPress={handlePresentModalPress} />
    </>
  );
}
