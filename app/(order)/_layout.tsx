import EditOrderBottomSheet from "@/presentation/orders/components/edit-order-bottom-sheet";
import NewOrderBottomSheet from "@/presentation/orders/new-order-bottom-sheet";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import IconButton from "@/presentation/theme/components/icon-button";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { router, Stack } from "expo-router";
import { useCallback, useEffect, useRef } from "react";

export default function OrdersLayout() {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const order = useOrdersStore((state) => state.activeOrder);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);

  const closeBottomSheet = () => {
    bottomSheetModalRef.current?.close(); // Close sheet before navigating
  };

  // callbacks
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  useEffect(() => {
    return () => {
      setActiveOrder(null);
    };
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="[id]/index"
          options={{
            headerShown: true,
            title: "Order",
            headerShadowVisible: false,
            headerRight: () => (
              <ThemedView style={tw`flex-row items-center gap-2`}>
                <IconButton
                  icon="create-outline"
                  onPress={handlePresentModalPress}
                ></IconButton>
                <IconButton
                  icon="ellipsis-horizontal"
                  onPress={handlePresentModalPress}
                ></IconButton>
              </ThemedView>
            ),
          }}
        />
        <Stack.Screen
          name="[id]/edit-order-detail/index"
          options={{
            headerShown: true,
            title: "",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="[id]/bills/index"
          options={{
            headerShown: true,
            title: "Payments",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="[id]/bills/[id]/index"
          options={{
            headerShown: true,
            title: "Bill payment",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="[id]/bills/new/index"
          options={{
            headerShown: true,
            title: "",
            headerShadowVisible: false,
          }}
        />
      </Stack>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
      >
        {order && (
          <EditOrderBottomSheet
            order={order}
            buttonProps={{ label: "Save changes" }}
            onOrderUpdated={closeBottomSheet}
          />
        )}
      </BottomSheetModal>
    </>
  );
}
