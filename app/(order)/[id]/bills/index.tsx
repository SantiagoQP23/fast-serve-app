import { ScrollView, RefreshControl, Alert } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { Ionicons } from "@expo/vector-icons";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import Button from "@/presentation/theme/components/button";
import BillCard from "@/presentation/orders/components/bill-card";
import { useOrders } from "@/presentation/orders/hooks/useOrders";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useBills } from "@/presentation/orders/hooks/useBills";
import { Bill } from "@/core/orders/models/bill.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import * as Haptics from "expo-haptics";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useQueryClient } from "@tanstack/react-query";

export default function OrderBillsScreen() {
  const { t } = useTranslation(["common", "orders", "bills", "errors"]);
  const router = useRouter();
  const order = useOrdersStore((state) => state.activeOrder);
  const setActiveBill = useOrdersStore((state) => state.setActiveBill);
  const billsByOrderQuery = useBills().billsByOrderQuery;
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const primaryColor = useThemeColor({}, "primary");

  const onRefresh = useCallback(async () => {
    if (!order?.id) return;

    try {
      setRefreshing(true);
      // Trigger haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Refetch bills for this order
      await queryClient.refetchQueries({
        queryKey: ["bills", "order", order.id],
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

  if (!order) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText>{t("orders:details.noActiveOrder")}</ThemedText>
      </ThemedView>
    );
  }

  const { data: bills } = billsByOrderQuery(order.id);

  const openBill = (bill: Bill) => {
    setActiveBill(bill);
    router.push(`/(order)/${order.id}/bills/${bill.id}`);
  };

  const orderAmountInBills: number = bills
    ? bills
        .map((bill) => bill.total + bill.discount)
        .reduce((acc, curr) => acc + (curr ?? 0), 0)
    : 0;

  return (
    <ThemedView style={tw`px-4 pt-8 flex-1 gap-8`}>
      <ThemedView style={tw`  items-center gap-8`}>
        <ThemedView style={tw`gap-1 items-center`}>
          <ThemedText type="h3">
            {t("orders:list.orderNumber", { number: order.num })}
          </ThemedText>
          <ThemedText type="body1">
            {order.type === OrderType.IN_PLACE
              ? `${t("common:labels.table")} ${order.table?.name}`
              : t("common:labels.takeAway")}
          </ThemedText>
          {/* <ThemedText type="small">Today, 11:30</ThemedText> */}
        </ThemedView>
        <ThemedText style={tw`text-7xl `}>
          {formatCurrency(order.total)}
        </ThemedText>
      </ThemedView>

      {/* <ThemedView style={tw`flex-1 justify-center items-center`}> */}
      {/*   <ThemedText>No bills</ThemedText> */}
      {/* </ThemedView> */}

      {bills?.length === 0 ? (
        <>
          <ThemedView style={tw` items-center  flex-1 gap-4 mt-8`}>
            <Ionicons
              name="document-text-outline"
              size={80}
              color={tw.color("gray-500")}
            />
            <ThemedText type="h3">{t("bills:list.noBills")}</ThemedText>
            <ThemedText type="body2" style={tw`text-center max-w-xs`}>
              {t("bills:list.noBillsDescription")}
            </ThemedText>
          </ThemedView>
        </>
      ) : (
        <ScrollView
          style={tw`flex-1 gap-2 flex-column`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`gap-4 flex-column`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={primaryColor}
              colors={[primaryColor]}
            />
          }
        >
          {bills?.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              onPress={() => openBill(bill)}
            />
          ))}
        </ScrollView>
      )}
      {order.total > orderAmountInBills && (
        <Button
          label={t("bills:list.addBill")}
          onPress={() => router.push('/(order)/${"sd"}/bills/new')}
        ></Button>
      )}
    </ThemedView>
  );
}
