import { ScrollView } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { Ionicons } from "@expo/vector-icons";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import Button from "@/presentation/theme/components/button";
import BillCard from "@/presentation/orders/components/bill-card";
import { useOrders } from "@/presentation/orders/hooks/useOrders";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useBills } from "@/presentation/orders/hooks/useBills";

export default function OrderBillsScreen() {
  const router = useRouter();
  const order = useOrdersStore((state) => state.activeOrder);
  const billsByOrderQuery = useBills().billsByOrderQuery;

  if (!order) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText>No active order</ThemedText>
      </ThemedView>
    );
  }

  const { data: bills } = billsByOrderQuery(order.id);

  return (
    <ThemedView style={tw`px-4 pt-8 flex-1 gap-8`}>
      <ThemedView style={tw`  items-center gap-8`}>
        <ThemedView style={tw`gap-1 items-center`}>
          <ThemedText type="h3">Order #{order.num}</ThemedText>
          <ThemedText type="body1">
            {order.type === OrderType.IN_PLACE
              ? `Table ${order.table?.name}`
              : "Take Away"}
          </ThemedText>
          {/* <ThemedText type="small">Today, 11:30</ThemedText> */}
        </ThemedView>
        <ThemedText style={tw`text-7xl `}>${order.total}</ThemedText>
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
            <ThemedText type="h3">No bills yet</ThemedText>
            <ThemedText type="body2" style={tw`text-center max-w-xs`}>
              There are no bills for this order yet. Tap the button below to add
              a new bill.
            </ThemedText>
          </ThemedView>
        </>
      ) : (
        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
          {bills?.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              onPress={() => router.push(`/(order)/1324/bills/1322`)}
            />
          ))}
        </ScrollView>
      )}
      <Button
        label="Add bill "
        onPress={() => router.push('/(order)/${"sd"}/bills/new')}
      ></Button>
    </ThemedView>
  );
}
