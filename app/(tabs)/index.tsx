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
import { useRouter } from "expo-router";
import { FlatList } from "react-native-gesture-handler";
import NewOrderBottomSheet from "@/presentation/orders/new-order-bottom-sheet";
import IconButton from "@/presentation/theme/components/icon-button";
import NotificationBadge from "@/presentation/theme/components/notification-badge";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

export default function HomeScreen() {
  const [status, setStatus] = useState("All");
  const { user } = useAuthStore();
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

  const pendingOrders = orders.filter((order) => order.status === "pending");
  const inProgressOrders = orders.filter(
    (order) => order.status === "inProgress",
  );
  const deliveredOrders = orders.filter(
    (order) => order.status === "delivered",
  );

  const haveAnOpenOrder = true;
  const screenWidth = Dimensions.get("window").width;

  return (
    <ThemedView style={tw`px-4 pt-8 flex-1 `}>
      <ThemedView style={tw`mb-6`}>
        <ThemedView
          style={tw`absolute  rounded-full items-center justify-center  z-10 right-2 top-2`}
        >
          {haveAnOpenOrder && (
            <ThemedView style={tw`relative`}>
              <IconButton
                icon="cart-outline"
                onPress={() => router.push("/(new-order)/cart")}
              />
              <NotificationBadge value={5} />
            </ThemedView>
          )}
        </ThemedView>
        <ThemedText type="body1">Welcome back!</ThemedText>
        <ThemedText type="h2" style={tw`mt-1`}>
          {user?.person.firstName}
        </ThemedText>
      </ThemedView>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-20 gap-4`}
      >
        <ThemedView>
          <ThemedView style={tw`  justify-between mb-4`}>
            <ThemedText type="h4">Pending</ThemedText>
            <ThemedText type="small">Count: {pendingOrders.length}</ThemedText>
          </ThemedView>
          <FlatList
            data={pendingOrders}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <ThemedView
                style={[
                  index !== pendingOrders.length - 1 && tw`mr-4`,
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
            data={inProgressOrders}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <ThemedView
                style={[
                  index !== inProgressOrders.length - 1 && tw`mr-4`,
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
            data={deliveredOrders}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <ThemedView
                style={[
                  index !== deliveredOrders.length - 1 && tw`mr-4`,
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
