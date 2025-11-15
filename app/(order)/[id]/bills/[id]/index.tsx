import { KeyboardAvoidingView, ScrollView } from "react-native";

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
import BillCard from "@/presentation/orders/components/bill-card";
import NewBillDetailCard from "@/presentation/orders/components/new-bill-detail-card";
import Switch from "@/presentation/theme/components/switch";
import PaymentMethodCard from "@/presentation/orders/components/payment-method-card";
import TextInput from "@/presentation/theme/components/text-input";

export default function BillScreen() {
  const { people, orderType, table, notes } = useNewOrderStore();
  const [section, setSection] = useState("");
  const [selected, setSelected] = useState("All");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(50);
  const [selectAll, setSelectAll] = useState(false);

  const sections = [
    { label: "Platos a la carta" },
    { label: "Bebidas" },
    { label: "Desayunos" },
    { label: "Otros" },
  ];

  const categories = [
    { label: "All" },
    { label: "Starters" },
    { label: "Main Course" },
    { label: "Desserts" },
    { label: "Beverages" },
  ];

  return (
    <KeyboardAvoidingView style={tw`flex-1`} behavior="padding">
      <ThemedView style={tw`px-4 pt-8 flex-1 gap-4`}>
        <ThemedView style={tw`  items-center gap-8`}>
          <ThemedView style={tw`gap-1 items-center`}>
            <ThemedText type="h3">Bill #111</ThemedText>
            <ThemedText type="body1">Today, 10:20</ThemedText>
          </ThemedView>
          <ThemedText style={tw`text-7xl `}>$30</ThemedText>
        </ThemedView>

        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
          <ThemedView style={tw`gap-2 mb-8`}>
            <ThemedView style={tw`flex-row justify-between items-center`}>
              <ThemedText type="h4">Filete apanado x4</ThemedText>
              <ThemedText>$50</ThemedText>
            </ThemedView>
            <ThemedView style={tw`flex-row justify-between items-center`}>
              <ThemedText type="h4">Filete apanado x4</ThemedText>
              <ThemedText>$50</ThemedText>
            </ThemedView>
            <ThemedView style={tw`flex-row justify-between items-center`}>
              <ThemedText type="h4">Filete apanado x4</ThemedText>
              <ThemedText>$50</ThemedText>
            </ThemedView>
            <ThemedView style={tw`flex-row justify-between items-center`}>
              <ThemedText type="h4">Filete apanado x4</ThemedText>
              <ThemedText>$50</ThemedText>
            </ThemedView>
            <ThemedView style={tw`flex-row justify-between items-center`}>
              <ThemedText type="h4">Filete apanado x4</ThemedText>
              <ThemedText>$50</ThemedText>
            </ThemedView>
            <ThemedView style={tw`flex-row justify-between items-center`}>
              <ThemedText type="h4">Filete apanado x4</ThemedText>
              <ThemedText>$50</ThemedText>
            </ThemedView>
          </ThemedView>
          <ThemedView style={tw` gap-4 `}>
            <ThemedText type="h3">Payment method</ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={tw` gap-2`}
              nestedScrollEnabled
            >
              <PaymentMethodCard
                paymentMethod={{ name: "Cash", icon: "cash-outline" }}
              />
              <PaymentMethodCard
                paymentMethod={{ name: "Credit Card", icon: "card-outline" }}
              />
              <PaymentMethodCard
                paymentMethod={{ name: "Transfer", icon: "wallet-outline" }}
              />
            </ScrollView>
          </ThemedView>
          <ThemedView style={tw` gap-4 mb-20 mt-4`}>
            <ThemedText type="h3">Received amount</ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={tw` gap-2`}
              nestedScrollEnabled
            >
              <Button label="$10" variant="outline"></Button>
            </ScrollView>
            <TextInput />
            <Button label="Exact amount" variant="outline" />
            <ThemedView style={tw` items-center mt-4 gap-2`}>
              <ThemedText>Change</ThemedText>
              <ThemedText type="h1">$10</ThemedText>
            </ThemedView>
          </ThemedView>
        </ScrollView>

        <Button label="Pay bill" onPress={() => router.back()}></Button>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}
