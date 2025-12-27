import EditOrderBottomSheet from "@/presentation/orders/components/edit-order-bottom-sheet";
import OrderOptionsBottomSheet from "@/presentation/orders/components/order-options-bottom-sheet";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import IconButton from "@/presentation/theme/components/icon-button";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import { useCallback, useEffect, useRef } from "react";

export default function OrdersLayout() {
  const editBottomSheetRef = useRef<BottomSheetModal>(null);
  const optionsBottomSheetRef = useRef<BottomSheetModal>(null);
  const order = useOrdersStore((state) => state.activeOrder);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);

  const closeEditBottomSheet = () => {
    editBottomSheetRef.current?.close();
  };

  const closeOptionsBottomSheet = () => {
    optionsBottomSheetRef.current?.close();
  };

  // callbacks
  const handlePresentEditModal = useCallback(() => {
    editBottomSheetRef.current?.present();
  }, []);

  const handlePresentOptionsModal = useCallback(() => {
    optionsBottomSheetRef.current?.present();
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
                  onPress={handlePresentEditModal}
                ></IconButton>
                <IconButton
                  icon="ellipsis-horizontal"
                  onPress={handlePresentOptionsModal}
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
        ref={editBottomSheetRef}
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
            onOrderUpdated={closeEditBottomSheet}
          />
        )}
      </BottomSheetModal>

      <BottomSheetModal
        ref={optionsBottomSheetRef}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
      >
        {order && (
          <OrderOptionsBottomSheet
            order={order}
            onClose={closeOptionsBottomSheet}
          />
        )}
      </BottomSheetModal>
    </>
  );
}
