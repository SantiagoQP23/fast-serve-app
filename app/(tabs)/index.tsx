import { ScrollView, Dimensions } from "react-native";

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
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";

export default function HomeScreen() {
  const { user } = useAuthStore();
  const orders = useOrdersStore((state) => state.orders);
  const router = useRouter();
  const details = useNewOrderStore((state) => state.details);

  // ref
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

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

  const pendingOrders = orders.filter(
    (order) => order.status === OrderStatus.PENDING,
  );
  const inProgressOrders = orders.filter(
    (order) => order.status === OrderStatus.IN_PROGRESS,
  );
  const deliveredOrders = orders.filter(
    (order) => order.status === OrderStatus.DELIVERED,
  );

  const haveAnOpenOrder = details.length > 0;

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
              <NotificationBadge value={details.length} />
            </ThemedView>
          )}
        </ThemedView>
        <ThemedText type="body1">Hello</ThemedText>
        <ThemedText type="h2" style={tw`mt-1`}>
          {user?.person.firstName}
        </ThemedText>
      </ThemedView>
      {orders.length === 0 ? (
        <>
          <ThemedView style={tw` items-center justify-center flex-1 gap-4`}>
            <Ionicons
              name="document-text-outline"
              size={80}
              color={tw.color("gray-500")}
            />
            <ThemedText type="h3">No orders yet</ThemedText>
            <ThemedText type="body2" style={tw`text-center max-w-xs`}>
              You have no orders at the moment. Create a new order to get
              started.
            </ThemedText>
          </ThemedView>
        </>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`pb-20 gap-4`}
        >
          <ThemedView>
            <ThemedView style={tw`  justify-between mb-4`}>
              <ThemedText type="h4">Pending</ThemedText>
              <ThemedText type="small">
                Count: {pendingOrders.length}
              </ThemedText>
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
            <ThemedView style={tw`  justify-between mb-4`}>
              <ThemedText type="h4">In Progress</ThemedText>
              <ThemedText type="small">
                Count: {inProgressOrders.length}
              </ThemedText>
            </ThemedView>
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
            <ThemedView style={tw`  justify-between mb-4`}>
              <ThemedText type="h4">Delivered</ThemedText>
              <ThemedText type="small">
                Count: {deliveredOrders.length}
              </ThemedText>
            </ThemedView>
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
      )}
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
