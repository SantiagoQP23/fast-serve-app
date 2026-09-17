import { Alert } from "react-native";
import { Colors, typography } from "@/constants/theme";
import OrderOptionsBottomSheet from "@/presentation/orders/components/order-options-bottom-sheet";
import ReassignOrderBottomSheet from "@/presentation/orders/components/reassign-order-bottom-sheet";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useOrders } from "@/presentation/orders/hooks/useOrders";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import IconButton from "@/presentation/theme/components/icon-button";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";

import { Stack } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";

export default function OrdersLayout() {
  const { t } = useTranslation(["common", "orders"]);
  const optionsBottomSheetRef = useRef<BottomSheetMethods>(null);
  const reassignBottomSheetRef = useRef<BottomSheetMethods>(null);
  const order = useOrdersStore((state) => state.activeOrder);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const { mutate: updateOrder } = useOrders().updateOrder;

  // Check if the order is closed
  const isClosed = order?.isClosed === true;
  const canCloseOrder =
    !isClosed &&
    order?.status === OrderStatus.DELIVERED &&
    order?.isPaid === true;

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

  const handleCloseOrder = useCallback(() => {
    if (!order) return;

    Alert.alert(
      t("orders:dialogs.closeTitle"),
      t("orders:dialogs.closeMessage"),
      [
        { text: t("common:actions.cancel"), style: "cancel" },
        {
          text: t("common:actions.close"),
          style: "destructive",
          onPress: () => {
            updateOrder({ id: order.id, isClosed: true });
          },
        },
      ],
    );
  }, [order, t, updateOrder]);

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
          headerStyle: { backgroundColor: Colors.light.background },
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
                  {canCloseOrder && (
                    <IconButton
                      icon="lock-closed-outline"
                      onPress={handleCloseOrder}
                      variant="secondary"
                    ></IconButton>
                  )}
                  <IconButton
                    icon="ellipsis-horizontal"
                    onPress={handlePresentOptionsModal}
                    variant="secondary"
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
