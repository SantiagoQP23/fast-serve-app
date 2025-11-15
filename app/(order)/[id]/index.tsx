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
import IconButton from "@/presentation/theme/components/icon-button";

export default function OrderScreen() {
  const { people, orderType, table, notes } = useNewOrderStore();
  const [section, setSection] = useState("");
  const [selected, setSelected] = useState("All");
  const router = useRouter();
  const [search, setSearch] = useState("");

  const openProduct = () => {
    router.push("/restaurant-menu/product");
  };

  return (
    <>
      <ThemedView style={tw`px-4 pt-8 flex-1 gap-4`}>
        <ThemedView style={tw`flex-row justify-between items-center`}>
          <ThemedView style={tw`gap-1`}>
            <ThemedText type="h1">Order #111</ThemedText>
            <ThemedText type="body2">Today, 11:30</ThemedText>
          </ThemedView>
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
        <ThemedView style={tw`gap-2`}>
          <ThemedText type="caption">Notes</ThemedText>
          <ThemedText type="body2">{notes}</ThemedText>
        </ThemedView>
        <ThemedView style={tw`flex-row justify-between items-center`}>
          <ThemedText type="body1">Pending</ThemedText>
          <Button
            label="Start"
            variant="outline"
            rightIcon="play-outline"
            size="small"
          />
        </ThemedView>
        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
          <NewOrderDetailCard
            product={{ name: "Arroz marinero", id: "1", price: 12 }}
          />
          <NewOrderDetailCard
            product={{ name: "Arroz marinero", id: "1", price: 12 }}
          />
          <NewOrderDetailCard
            product={{ name: "Arroz marinero", id: "1", price: 12 }}
          />
          <NewOrderDetailCard
            product={{ name: "Arroz marinero", id: "1", price: 12 }}
          />
          <NewOrderDetailCard
            product={{ name: "Arroz marinero", id: "1", price: 12 }}
            onPress={openProduct}
          />
          <NewOrderDetailCard
            product={{ name: "Arroz marinero", id: "1", price: 12 }}
          />
        </ScrollView>
      </ThemedView>
      <ThemedView style={tw`gap-4 p-4 rounded-lg `}>
        <ThemedView style={tw`flex-row justify-between items-center`}>
          <ThemedText type="h3">Total</ThemedText>
          <ThemedText type="h2">$55</ThemedText>
        </ThemedView>
        <ThemedView style={tw`flex-row justify-between items-center`}>
          <IconButton
            icon="trash-outline"
            onPress={() => {}}
            color="danger"
            disabled
          />
          <Button
            label="Payments"
            variant="secondary"
            onPress={() => router.push(`/(order)/${"sd"}/bills`)}
          ></Button>
        </ThemedView>
      </ThemedView>
    </>
  );
}
