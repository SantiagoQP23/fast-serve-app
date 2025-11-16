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

export default function OrderBillsScreen() {
  const { people, orderType, table, notes } = useNewOrderStore();
  const [section, setSection] = useState("");
  const [selected, setSelected] = useState("All");
  const router = useRouter();
  const [search, setSearch] = useState("");

  return (
    <ThemedView style={tw`px-4 pt-8 flex-1 gap-4`}>
      <ThemedView style={tw`  items-center gap-8`}>
        <ThemedView style={tw`gap-1 items-center`}>
          <ThemedText type="h3">Order #111</ThemedText>
          <ThemedText type="body1">Table 1</ThemedText>
          {/* <ThemedText type="small">Today, 11:30</ThemedText> */}
        </ThemedView>
        <ThemedText style={tw`text-7xl `}>$30</ThemedText>
      </ThemedView>

      {/* <ThemedView style={tw`flex-1 justify-center items-center`}> */}
      {/*   <ThemedText>No bills</ThemedText> */}
      {/* </ThemedView> */}
      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
        <BillCard
          bill={{ id: "sdklj" }}
          onPress={() => router.push(`/(order)/1324/bills/1322`)}
        />
        <BillCard bill={{ id: "sdklj" }} />
        <BillCard bill={{ id: "sdklj" }} />
        <BillCard bill={{ id: "sdklj" }} />
      </ScrollView>
      <Button
        label="Add bill "
        onPress={() => router.push('/(order)/${"sd"}/bills/new')}
      ></Button>
    </ThemedView>
  );
}
