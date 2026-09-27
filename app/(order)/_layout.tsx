import { Colors, typography } from "@/constants/theme";
import CloseOrderModal from "@/presentation/orders/components/close-order-modal";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import { useModal } from "@/presentation/shared/hooks/useModal";
import IconButton from "@/presentation/theme/components/icon-button";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";

import { Stack } from "expo-router";
import { useEffect } from "react";
import Button from "@/presentation/theme/components/button";

export default function OrdersLayout() {
  const order = useOrdersStore((state) => state.activeOrder);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const {
    isOpen: closeModalIsOpen,
    handleOpen: openCloseModal,
    handleClose: closeCloseModal,
  } = useModal();

  // Check if the order is closed
  const isClosed = order?.isClosed === true;
  const canCloseOrder =
    !isClosed &&
    order?.status === OrderStatus.DELIVERED &&
    order?.isPaid === true;

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
              !isClosed && canCloseOrder ? (
                <ThemedView style={tw`flex-row items-center gap-2`}>
                  <Button
                    leftIcon="lock-closed-outline"
                    label="Close order"
                    onPress={openCloseModal}
                    variant="secondary"
                    size="small"
                  ></Button>
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

      <CloseOrderModal
        order={order}
        visible={closeModalIsOpen}
        onClose={closeCloseModal}
      />
    </>
  );
}
