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
import NewBillDetailCard from "@/presentation/orders/components/new-bill-detail-card";
import Switch from "@/presentation/theme/components/switch";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";

export default function NewBillScreen() {
  const router = useRouter();
  const order = useOrdersStore((state) => state.activeOrder);
  const [total, setTotal] = useState(50);
  const [selectAll, setSelectAll] = useState(false);

  if (!order) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText>No active order</ThemedText>
      </ThemedView>
    );
  }

  const detailsToPay = order.details.filter(
    (detail) => detail.quantity !== detail.qtyPaid,
  );

  const paidDetails = order.details.filter(
    (detail) => detail.quantity === detail.qtyPaid,
  );

  return (
    <ThemedView style={tw`px-4 pt-8 flex-1 gap-4`}>
      <ThemedView style={tw`flex-row items-center justify-between gap-8`}>
        <ThemedView style={tw`gap-1 `}>
          <ThemedText type="h1">New Bill</ThemedText>
          <ThemedText type="body1">Order #{order.num}</ThemedText>
          {/* <ThemedText type="small">Today, 11:30</ThemedText> */}
        </ThemedView>
        <ThemedView>
          <ThemedText type="body1">Total</ThemedText>
          <ThemedText type="h4">${order.total}</ThemedText>
        </ThemedView>
      </ThemedView>

      <Switch
        label="Select all items"
        value={selectAll}
        onValueChange={setSelectAll}
      />
      <ScrollView>
        {detailsToPay.map((detail) => (
          <NewBillDetailCard key={detail.id} detail={detail} />
        ))}
        <ThemedText type="h3" style={tw`mt-4 mb-2`}>
          Billed items
        </ThemedText>
        <ThemedView style={tw`gap-2 mb-20`}>
          {paidDetails.length === 0 && (
            <ThemedText type="body2">No billed items yet.</ThemedText>
          )}

          {paidDetails.map((detail) => (
            <ThemedText key={detail.id}>
              {detail.product.name} x{detail.quantity}
            </ThemedText>
          ))}
        </ThemedView>
      </ScrollView>

      <Button
        label={"Create bill - " + total}
        onPress={() => router.back()}
      ></Button>
    </ThemedView>
  );
}
