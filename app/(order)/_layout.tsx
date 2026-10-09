import { Colors, typography } from "@/constants/theme";
import CloseOrderModal from "@/presentation/orders/components/close-order-modal";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import { OrderDetailStatus } from "@/core/orders/models/order-detail.model";
import { useModal } from "@/presentation/shared/hooks/useModal";
import { useMarkOrderDelivered } from "@/presentation/orders/hooks/useMarkOrderDelivered";
import IconButton from "@/presentation/theme/components/icon-button";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

import { Stack } from "expo-router";
import { useEffect } from "react";
import Button from "@/presentation/theme/components/button";

export default function OrdersLayout() {
  const { t } = useTranslation(["orders"]);
  const order = useOrdersStore((state) => state.activeOrder);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const { markDelivered } = useMarkOrderDelivered();
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
  const hasPendingItems = (order?.details ?? []).some(
    (detail) =>
      detail.status !== OrderDetailStatus.DELIVERED &&
      detail.status !== OrderDetailStatus.CANCELLED,
  );
  const canMarkDelivered =
    !isClosed && order?.status !== OrderStatus.DELIVERED && hasPendingItems;

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
              canMarkDelivered || canCloseOrder ? (
                <ThemedView style={tw`flex-row items-center gap-2`}>
                  {canMarkDelivered && (
                    <Button
                      leftIcon="checkmark-done-outline"
                      label={t("orders:options.markDelivered")}
                      onPress={() => order && markDelivered(order)}
                      variant="outline"
                      size="small"
                    ></Button>
                  )}
                  {canCloseOrder && (
                    <Button
                      leftIcon="lock-closed-outline"
                      label={t("orders:options.closeOrder")}
                      onPress={openCloseModal}
                      variant="outline"
                      size="small"
                    ></Button>
                  )}
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
        <Stack.Screen
          name="unprinted-tickets/index"
          options={{
            headerShown: true,
            title: t("orders:unprintedTickets.title"),
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
