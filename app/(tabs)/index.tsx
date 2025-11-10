import {
  Platform,
  StyleSheet,
  ScrollView,
  Text,
  View,
  Dimensions,
} from "react-native";

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
import OrderCard, { Order } from "@/presentation/home/components/order-card";
import { useCallback, useRef, useState } from "react";
import Button from "@/presentation/theme/components/button";
import ButtonGroup from "@/presentation/theme/components/button-group";
import Select from "@/presentation/theme/components/select";
import { useRouter } from "expo-router";
import { FlatList } from "react-native-gesture-handler";
import NewOrderBottomSheet from "@/presentation/orders/new-order-bottom-sheet";

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

  const orders: Order[] = [
    { num: 1, status: "pending" },
    { num: 2, status: "inProgress" },
    { num: 3, status: "delivered" },
    { num: 4, status: "pending" },
    { num: 5, status: "inProgress" },
    { num: 6, status: "delivered" },
  ];

  const screenWidth = Dimensions.get("window").width;

  return (
    <ThemedView style={tw`px-4 pt-8 flex-1 `}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-20 gap-4`}
      >
        <ThemedView style={tw`mb-4`}>
          <ThemedText type="h1">Home</ThemedText>
          <ThemedText type="h3" style={tw`mt-1`}>
            Hi, Santiago!
          </ThemedText>
        </ThemedView>
        <ThemedView>
          <ThemedText style={tw`font-semibold mb-4 text-gray-700`}>
            Pending
          </ThemedText>
          <FlatList
            data={orders.filter((order) => order.status === "pending")}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <ThemedView
                style={[
                  index !== orders.length - 1 && tw`mr-4`,
                  { width: screenWidth * 0.8 },
                ]}
              >
                <OrderCard order={item} />
              </ThemedView>
            )}
            style={tw``}
          />
        </ThemedView>
        <ThemedView>
          <ThemedText style={tw`font-semibold mb-4 text-gray-700`}>
            In progress
          </ThemedText>
          <FlatList
            data={orders.filter((order) => order.status === "inProgress")}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <ThemedView
                style={[
                  index !== orders.length - 1 && tw`mr-4`,
                  { width: screenWidth * 0.8 },
                ]}
              >
                <OrderCard order={item} />
              </ThemedView>
            )}
            style={tw``}
          />
        </ThemedView>
        <ThemedView>
          <ThemedText style={tw`font-semibold mb-4 text-gray-700`}>
            Delivered
          </ThemedText>
          <FlatList
            data={orders.filter((order) => order.status === "delivered")}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <ThemedView
                style={[
                  index !== orders.length - 1 && tw`mr-4`,
                  { width: screenWidth * 0.8 },
                ]}
              >
                <OrderCard order={item} />
              </ThemedView>
            )}
            style={tw``}
          />
        </ThemedView>
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
        <NewOrderBottomSheet onCreateOrder={handleNavigate} />
      </BottomSheetModal>
      <Fab icon="add-outline" onPress={handlePresentModalPress} />
    </ThemedView>
  );
}
