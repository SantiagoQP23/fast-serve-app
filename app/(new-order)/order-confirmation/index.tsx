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
import NewOrderDetailCard from "@/presentation/orders/components/new-order-detail-card";

export default function OrderConfirmationScreen() {
  const { people, orderType, table, notes } = useNewOrderStore();
  const [section, setSection] = useState("");
  const [selected, setSelected] = useState("All");
  const router = useRouter();

  const openProduct = () => {
    router.push("/restaurant-menu/product");
  };

  const onCreateOrder = () => {
    router.replace("/(new-order)/order-confirmation", { withAnchor: true });
  };

  return (
    <>
      <ThemedView
        style={tw`px-4 pt-8 flex-1 gap-8 items-center justify-center`}
      >
        <ThemedView style={tw``}>
          <ThemedText type="h1">Order Confirmed</ThemedText>
          <ThemedText type="body1">The new order has been created</ThemedText>
        </ThemedView>
        <ThemedView style={tw` w-full bg-gray-100 p-4 rounded-lg`}>
          <ThemedView
            style={tw`flex-row justify-between items-center bg-transparent `}
          >
            <ThemedText type="body1">Total</ThemedText>
            <ThemedText type="body1" style={tw`font-bold`}>
              $55
            </ThemedText>
          </ThemedView>
        </ThemedView>
        {notes && (
          <ThemedView style={tw`gap-2`}>
            <ThemedText type="caption">Notes</ThemedText>
            <ThemedText type="body2">{notes}</ThemedText>
          </ThemedView>
        )}
        <ThemedView style={tw`w-full flex-row gap-4 justify-center`}>
          <Button
            leftIcon="home-outline"
            label="Go to home"
            onPress={() => router.replace("/(tabs)")}
            variant="outline"
          ></Button>
          <Button
            leftIcon="pencil-outline"
            label="Edit order"
            onPress={() => router.replace("/(order)/[id]")}
            variant="primary"
          ></Button>
        </ThemedView>
      </ThemedView>
    </>
  );
}
