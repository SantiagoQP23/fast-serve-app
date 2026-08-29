import { typography } from "@/constants/theme";
import OrderOptionsBottomSheet from "@/presentation/orders/components/order-options-bottom-sheet";
import ReassignOrderBottomSheet from "@/presentation/orders/components/reassign-order-bottom-sheet";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import IconButton from "@/presentation/theme/components/icon-button";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";

import { Stack } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";

export default function OrdersLayout() {
  const optionsBottomSheetRef = useRef<BottomSheetMethods>(null);
  const reassignBottomSheetRef = useRef<BottomSheetMethods>(null);
  const order = useOrdersStore((state) => state.activeOrder);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);

  // Check if the order is closed
  const isClosed = order?.isClosed === true;

  const closeOptionsBottomSheet = () => {
    optionsBottomSheetRef.current?.close();
  };

  const closeReassignBottomSheet = () => {
    reassignBottomSheetRef.current?.close();
  };

  // callbacks
  const handlePresentOptionsModal = useCallback(() => {
    optionsBottomSheetRef.current?.present();
  }, []);

  const handlePresentReassignModal = useCallback(() => {
    reassignBottomSheetRef.current?.present();
  }, []);

  useEffect(() => {
    return () => {
      setActiveOrder(null);
    };
  }, []);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          headerTitleStyle: { fontFamily: typography.medium },
        }}
      >
        <Stack.Screen
          name="[id]/index"
          options={{
            headerShown: true,
            title: "",
            headerShadowVisible: false,
            headerRight: () =>
              !isClosed ? (
                <ThemedView style={tw`flex-row items-center gap-2`}>
                  <IconButton
                    icon="ellipsis-horizontal"
                    onPress={handlePresentOptionsModal}
                  ></IconButton>
                </ThemedView>
              ) : null,
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
          name="[id]/bills/new/index"
          options={{
            headerShown: true,
            title: "",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="[id]/tickets/index"
          options={{
            headerShown: true,
            title: "Order tickets",
            headerShadowVisible: false,
          }}
        />
      </Stack>

      <ThemedBottomSheetModal ref={optionsBottomSheetRef} enablePanDownToClose>
        {order && (
          <OrderOptionsBottomSheet
            order={order}
            onClose={closeOptionsBottomSheet}
            onReassign={handlePresentReassignModal}
          />
        )}
      </ThemedBottomSheetModal>

      <ThemedBottomSheetModal ref={reassignBottomSheetRef} enablePanDownToClose>
        {order && (
          <ReassignOrderBottomSheet
            order={order}
            onClose={closeReassignBottomSheet}
          />
        )}
      </ThemedBottomSheetModal>
    </>
  );
}
