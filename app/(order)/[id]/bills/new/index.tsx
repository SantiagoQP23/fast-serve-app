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
import BillCard from "@/presentation/orders/components/bill-card";
import NewBillDetailCard from "@/presentation/orders/components/new-bill-detail-card";
import Switch from "@/presentation/theme/components/switch";

export default function NewBillScreen() {
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
    <ThemedView style={tw`px-4 pt-8 flex-1 gap-4`}>
      <ThemedView style={tw`flex-row items-center justify-between gap-8`}>
        <ThemedView style={tw`gap-1 `}>
          <ThemedText type="h3">New Bill</ThemedText>
          <ThemedText type="body1">Order #111</ThemedText>
          {/* <ThemedText type="small">Today, 11:30</ThemedText> */}
        </ThemedView>
        <ThemedView>
          <ThemedText type="body1"> Total</ThemedText>
          <ThemedText type="h4"> $30</ThemedText>
        </ThemedView>
      </ThemedView>

      <Switch
        label="Select all items"
        value={selectAll}
        onValueChange={setSelectAll}
      />
      <ScrollView>
        <NewBillDetailCard />
        <NewBillDetailCard />
        <NewBillDetailCard />
        <NewBillDetailCard />
        <NewBillDetailCard />
        <ThemedText type="h3" style={tw`mt-4 mb-2`}>
          Billed items
        </ThemedText>
        <ThemedView style={tw`gap-2 mb-20`}>
          <ThemedText>Filete apando x4</ThemedText>
          <ThemedText>Filete apando x4</ThemedText>
          <ThemedText>Filete apando x4</ThemedText>
          <ThemedText>Filete apando x4</ThemedText>
        </ThemedView>
      </ScrollView>

      <Button
        label={"Create bill - " + total}
        onPress={() => router.back()}
      ></Button>
    </ThemedView>
  );
}
