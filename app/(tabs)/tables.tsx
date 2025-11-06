import {
  Platform,
  StyleSheet,
  ScrollView,
  Text,
  FlatList,
  Pressable,
} from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";

import TableCard, { Table } from "@/presentation/home/components/table-card";
import { useState } from "react";
import tw from "@/presentation/theme/lib/tailwind";

export default function TablesScreen() {
  const [selectedStatus, setSelectedStatus] = useState<boolean | "all">("all");

  const tables: Table[] = [
    { name: "Table 1", isAvailable: true },
    { name: "Table 2", isAvailable: false },
    { name: "Table 3", isAvailable: false },
    { name: "Table 4", isAvailable: false },
    { name: "Table 5", isAvailable: true },
    { name: "Table 6", isAvailable: true },
    { name: "Table 7", isAvailable: false },
    { name: "Table 8", isAvailable: true },
    { name: "Table 9", isAvailable: true },
    { name: "Table 10", isAvailable: false },
    { name: "Table 11", isAvailable: true },
    { name: "Table 12", isAvailable: false },
    { name: "Table 13", isAvailable: true },
    { name: "Table 14", isAvailable: true },
    { name: "Table 15", isAvailable: false },
  ];

  const tabs: { label: string; value: boolean | "all" }[] = [
    { label: "All", value: "all" },
    { label: "Available", value: true },
    { label: "Occupied", value: false },
  ];

  return (
    <ThemedView style={tw`px-4 pt-8 flex-1`}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Tables</ThemedText>
      </ThemedView>
      <ThemedView style={tw`mt-8`} />
      <ThemedView style={tw`flex-row mb-4`}>
        {tabs.map((tab) => {
          const isActive = tab.value === selectedStatus;
          return (
            <Pressable
              key={tab.value.toString()}
              onPress={() => setSelectedStatus(tab.value)}
              style={tw`px-4 py-2 mr-2 rounded-full ${
                isActive ? "bg-light-primary" : "bg-gray-200"
              }`}
            >
              <Text
                style={tw`${isActive ? "text-white" : "text-gray-800"} font-medium`}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ThemedView>
      <ThemedView style={tw`mt-4`} />
      <FlatList
        data={tables}
        keyExtractor={(item) => item.name.toString()}
        renderItem={(item) => <TableCard table={item.item} />}
        numColumns={2} // 2 columns grid
        columnWrapperStyle={tw`justify-between mb-4`}
        contentContainerStyle={tw`pb-20`}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
