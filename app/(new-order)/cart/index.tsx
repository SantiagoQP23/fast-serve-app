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
import OrderDetailCard from "@/presentation/orders/components/new-order-detail-card";

export default function CartScreen() {
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
      <ThemedView style={tw`px-4 pt-8 flex-1 gap-4`}>
        <ThemedView style={tw`flex-row justify-between items-center`}>
          <ThemedText type="h1">Cart</ThemedText>
          <ThemedView>
            <ThemedView>
              <ThemedText type="h4">
                {orderType === OrderType.IN_PLACE
                  ? `Table ${table?.name}`
                  : "Take Away"}
              </ThemedText>
            </ThemedView>
            <ThemedView
              style={tw` flex-row justify-end bg-transparent items-center gap-2`}
            >
              <Ionicons name="people-outline" size={18} />
              <ThemedText type="body2">{people}</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
        {notes && (
          <ThemedView style={tw`gap-2`}>
            <ThemedText type="caption">Notes</ThemedText>
            <ThemedText type="body2">{notes}</ThemedText>
          </ThemedView>
        )}
        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
          <OrderDetailCard
            product={{ name: "Arroz marinero", id: "1", price: 12 }}
          />
          <OrderDetailCard
            product={{ name: "Arroz marinero", id: "1", price: 12 }}
          />
          <OrderDetailCard
            product={{ name: "Arroz marinero", id: "1", price: 12 }}
          />
          <OrderDetailCard
            product={{ name: "Arroz marinero", id: "1", price: 12 }}
          />
          <OrderDetailCard
            product={{ name: "Arroz marinero", id: "1", price: 12 }}
            onPress={openProduct}
          />
          <OrderDetailCard
            product={{ name: "Arroz marinero", id: "1", price: 12 }}
          />
          <Button
            leftIcon="add-outline"
            label="Add product "
            variant="outline"
            onPress={() => router.push("/restaurant-menu")}
          />
        </ScrollView>
      </ThemedView>

      <ThemedView style={tw`gap-4 p-4 rounded-xl shadow-xl `}>
        <ThemedView style={tw`flex-row justify-between items-center`}>
          <ThemedText type="h3">Total</ThemedText>
          <ThemedText type="h2">$55</ThemedText>
        </ThemedView>
        <Button label="Create order" onPress={onCreateOrder}></Button>
      </ThemedView>
    </>
  );
}
