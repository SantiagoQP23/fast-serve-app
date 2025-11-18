import { Platform, StyleSheet, ScrollView, Text } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import OrderCard from "@/presentation/home/components/order-card";
import ProductCard from "@/presentation/restaurant-menu/product-card";
import ButtonGroup from "@/presentation/theme/components/button-group";
import { useState } from "react";
import Chip from "@/presentation/theme/components/chip";
import { useRouter } from "expo-router";
import TextInput from "@/presentation/theme/components/text-input";
import IconButton from "@/presentation/theme/components/icon-button";

export default function RestaurantMenuScreen() {
  const [section, setSection] = useState("");
  const [selected, setSelected] = useState("All");
  const router = useRouter();
  const [search, setSearch] = useState("");

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

  const openProduct = () => {
    router.push("/restaurant-menu/product");
  };

  return (
    <ThemedView style={tw`px-4 pt-8 flex-1 gap-4`}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="h1">Menu</ThemedText>
      </ThemedView>
      <TextInput
        value={search}
        onChangeText={(value) => setSearch(value)}
        icon="search-outline"
        leftIcon={
          search && (
            <IconButton
              icon="close-circle-outline"
              onPress={() => setSearch("")}
            ></IconButton>
          )
        }
      />
      {!search && (
        <ThemedView>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={tw`gap-2`}
          >
            {sections.map((f) => (
              <ThemedView style={tw`mr-2`} key={f.label}>
                <Chip
                  key={f.label}
                  label={f.label}
                  selected={selected === f.label}
                  onPress={() => setSelected(f.label)}
                />
              </ThemedView>
            ))}
          </ScrollView>
        </ThemedView>
      )}
      <ThemedView style={tw` flex-row gap-2`}>
        {!search && (
          <ThemedView style={tw` flex-wrap gap-2 `}>
            {categories.map((f) => (
              <Chip
                key={f.label}
                label={f.label}
                selected={selected === f.label}
                onPress={() => setSelected(f.label)}
              />
            ))}
          </ThemedView>
        )}
        <ScrollView
          style={tw`flex-1 mb-20`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`gap-3 pb-20`}
        >
          <ProductCard
            product={{ name: "Arroz marinero", id: "1", price: 10 }}
          ></ProductCard>
          <ProductCard
            product={{ name: "Arroz marinero", id: "1", price: 10 }}
          ></ProductCard>
          <ProductCard
            product={{ name: "Arroz marinero", id: "1", price: 10 }}
          ></ProductCard>
          <ProductCard
            onPress={openProduct}
            product={{ name: "Arroz marinero", id: "1", price: 10 }}
          ></ProductCard>
          <ProductCard
            onPress={openProduct}
            product={{ name: "Arroz marinero", id: "1", price: 10 }}
          ></ProductCard>
          <ProductCard
            onPress={openProduct}
            product={{ name: "Arroz marinero", id: "1", price: 10 }}
          ></ProductCard>
          <ProductCard
            onPress={openProduct}
            product={{ name: "Arroz marinero", id: "1", price: 10 }}
          ></ProductCard>
          <ProductCard
            onPress={openProduct}
            product={{ name: "Arroz marinero", id: "1", price: 10 }}
          ></ProductCard>
          <ProductCard
            onPress={openProduct}
            product={{ name: "Arroz marinero", id: "1", price: 10 }}
          ></ProductCard>
        </ScrollView>
      </ThemedView>
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
