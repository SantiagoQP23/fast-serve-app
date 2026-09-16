import { ScrollView, RefreshControl, Alert } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/presentation/theme/components/button";
import BillCard from "@/presentation/orders/components/bill-card";
import { useBills } from "@/presentation/orders/hooks/useBills";
import { Bill } from "@/core/orders/models/bill.model";
import { Order } from "@/core/orders/models/order.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import * as Haptics from "expo-haptics";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useQueryClient } from "@tanstack/react-query";

interface OrderBillsTabProps {
  order: Order;
}

export default function OrderBillsTab({ order }: OrderBillsTabProps) {
  const { t } = useTranslation(["common", "orders", "bills", "errors"]);
  const router = useRouter();
  const billsByOrderQuery = useBills().billsByOrderQuery;
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const primaryColor = useThemeColor({}, "primary");

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await queryClient.refetchQueries({
        queryKey: ["bills", order.id],
      });
    } catch {
      Alert.alert(
        t("errors:order.fetchError"),
        t("errors:order.ordersFetchFailed"),
      );
    } finally {
      setRefreshing(false);
    }
  }, [order.id, queryClient, t]);

  const { data: bills } = billsByOrderQuery(order.id);

  const openBill = (bill: Bill) => {
    router.push(`/(bills)/${bill.id}`);
  };

  const orderAmountInBills: number = bills
    ? bills
        .map((bill) => bill.total + bill.discount)
        .reduce((acc, curr) => acc + (curr ?? 0), 0)
    : 0;
  const remainingAmount = Math.max(order.total - orderAmountInBills, 0);

  return (
    <ThemedView style={tw`flex-1 gap-8`}>
      <ThemedView style={tw` gap-2`}>
        <ThemedView>
          {/* <ThemedText style={tw`text-5xl`}> */}
          {/*   {formatCurrency(order.total)} */}
          {/* </ThemedText> */}

          {remainingAmount > 0 && (
            <ThemedView style={tw`flex-row  gap-2 items-center `}>
              <ThemedView>
                <ThemedText type="small" style={tw`text-primary-700`}>
                  {t("bills:list.remaining")}
                </ThemedText>
              </ThemedView>
              <ThemedText type="body2" style={tw`text-primary-900`}>
                {formatCurrency(remainingAmount)}
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      </ThemedView>

      {bills?.length === 0 ? (
        <ThemedView style={tw`items-center flex-1 gap-4 mt-8`}>
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
      ) : (
        <ScrollView
          style={tw`flex-1 gap-2 flex-column `}
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
          <ThemedView style={tw`h-20`} />
        </ScrollView>
      )}
      {/* {remainingAmount > 0 && ( */}
      {/*   <Button */}
      {/*     label={t("bills:list.addBill")} */}
      {/*     onPress={() => router.push(`/(order)/${order.id}/bills/new`)} */}
      {/*   /> */}
      {/* )} */}
    </ThemedView>
  );
}
