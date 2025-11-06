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
import Switch from "@/presentation/theme/components/switch";
import TextInput from "@/presentation/theme/components/text-input";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";

export default function RestaurantMenuScreen() {
  const [section, setSection] = useState("");
  const [counter, setCounter] = useState(1);
  const router = useRouter();
  const [selected, setSelected] = useState("All");
  const [withNotes, setWithNotes] = useState(true);

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

  const goToMenu = () => {
    router.back();
  };

  return (
    <ThemedView style={tw`px-4 pt-8 flex-1 gap-4`}>
      <ThemedView style={tw`flex-row justify-between mb-4 items-center`}>
        <ThemedView>
          <ThemedText style={tw`text-2xl font-bold`}>Arroz marinero</ThemedText>
          <ThemedText style={tw`text-lg`}>$12</ThemedText>
        </ThemedView>
        <ThemedView style={tw`flex-row items-center gap-2`}>
          <IconButton
            icon="remove-outline"
            onPress={() => setCounter((value) => value - 1)}
          />
          <ThemedText>{counter}</ThemedText>
          <IconButton
            icon="add"
            onPress={() => setCounter((value) => value + 1)}
          />
        </ThemedView>
      </ThemedView>
      <ThemedText>
        lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
      </ThemedText>
      <ThemedView>
        <Switch
          label="Add note"
          value={withNotes}
          onValueChange={setWithNotes}
        />
        {withNotes && <TextInput numberOfLines={5} multiline />}
      </ThemedView>
      <ThemedView style={tw`w-full `}>
        <Button label="Add to order " onPress={goToMenu} />
      </ThemedView>
    </ThemedView>
  );
}
