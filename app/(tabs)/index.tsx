import { Platform, StyleSheet, ScrollView, Text, View } from "react-native";

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";

import Fab from "@/presentation/theme/components/fab";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import OrderCard from "@/presentation/home/components/order-card";
import { useCallback, useRef, useState } from "react";
import Button from "@/presentation/theme/components/button";
import ButtonGroup from "@/presentation/theme/components/button-group";
import Select from "@/presentation/theme/components/select";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const [status, setStatus] = useState("All");
  const [selectedWaiter, setSelectedWaiter] = useState<string | number>();
  const [people, setPeople] = useState(1);
  const router = useRouter();

  // ref
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const waiters = [
    { label: "1", value: 1 },
    { label: "2", value: 2 },
    { label: "3", value: 3 },
    { label: "4", value: 4 },
  ];

  const handleNavigate = () => {
    bottomSheetModalRef.current?.close(); // Close sheet before navigating
    router.push("/restaurant-menu"); // Navigate to New Order screen
  };

  // callbacks
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  return (
    <ThemedView style={tw`px-4 pt-8 flex-1`}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedView style={tw`mb-4`}>
          <ThemedText type="title">Home</ThemedText>
          <ThemedText type="subtitle" style={tw`mt-1`}>
            Hi, Santiago!
          </ThemedText>
        </ThemedView>
        <OrderCard order={{ num: 1 }} />
        <OrderCard order={{ num: 2 }} />
        <OrderCard order={{ num: 3 }} />
        <OrderCard order={{ num: 3 }} />
        <OrderCard order={{ num: 3 }} />
        <OrderCard order={{ num: 3 }} />
      </ScrollView>
      <BottomSheetModal
        ref={bottomSheetModalRef}
        onChange={handleSheetChanges}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
      >
        <BottomSheetView style={tw`p-4 items-center justify-center`}>
          <ThemedView style={tw`w-full gap-6`}>
            <Text style={tw`text-xl text-center font-bold `}>New Order </Text>
            <ButtonGroup
              options={["Dine In", "Take Away"]}
              selected={status}
              onChange={setStatus}
            />

            <Select
              label="Table"
              placeholder="Select table"
              options={waiters}
              value={selectedWaiter}
              onChange={setSelectedWaiter}
            />

            <ThemedView style={tw`gap-2`}>
              <Text style={tw`text-gray-700 dark:text-gray-300  font-semibold`}>
                People
              </Text>
              <ButtonGroup
                options={["1", "2", "3", "4", "5", "6"]}
                selected={people.toString()}
                onChange={(value) => setPeople(+value)}
              />
            </ThemedView>

            <ThemedView style={tw`w-full `}>
              <Button label="Create order" onPress={handleNavigate} />
            </ThemedView>
          </ThemedView>
        </BottomSheetView>
      </BottomSheetModal>
      <Fab icon="add-outline" onPress={handlePresentModalPress} />
    </ThemedView>
  );
}
