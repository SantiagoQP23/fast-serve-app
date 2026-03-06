import { useRef } from "react";
import { View } from "react-native";
import { Drawer } from "expo-router/drawer";
import { useRouter } from "expo-router";
import IconButton from "@/presentation/theme/components/icon-button";
import NotificationBadge from "@/presentation/theme/components/notification-badge";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import {
  OrdersModuleProvider,
  useOrdersModuleContext,
} from "./orders-module.context";

function MyOrdersHeaderRight() {
  const router = useRouter();
  const details = useNewOrderStore((state) => state.details);
  const haveAnOpenOrder = details.length > 0;
  const { openViewPopover } = useOrdersModuleContext();
  const moreButtonRef = useRef<View>(null);

  const handleMorePress = () => {
    moreButtonRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      openViewPopover({ x: pageX, y: pageY, width, height });
    });
  };

  return (
    <View style={tw`flex-row items-center gap-4 mr-2`}>
      {haveAnOpenOrder && (
        <ThemedView style={tw``}>
          <IconButton
            icon="cart-outline"
            onPress={() => router.push("/(new-order)/cart")}
          />
          <NotificationBadge value={details.length} />
        </ThemedView>
      )}
      <View ref={moreButtonRef} collapsable={false}>
        <IconButton icon="ellipsis-vertical" onPress={handleMorePress} />
      </View>
    </View>
  );
}

function AllOrdersHeaderRight() {
  const router = useRouter();
  const details = useNewOrderStore((state) => state.details);
  const haveAnOpenOrder = details.length > 0;

  if (!haveAnOpenOrder) return null;

  return (
    <ThemedView style={tw`mr-4`}>
      <IconButton
        icon="cart-outline"
        onPress={() => router.push("/(new-order)/cart")}
      />
      <NotificationBadge value={details.length} />
    </ThemedView>
  );
}

function OrdersDrawer() {
  const { t } = useTranslation("orders");

  return (
    <Drawer screenOptions={{ headerShown: true }}>
      <Drawer.Screen
        name="my-orders"
        options={{
          drawerLabel: t("drawer.myOrders"),
          title: t("drawer.myOrders"),
          headerShadowVisible: false,
          headerRight: () => <MyOrdersHeaderRight />,
        }}
      />
      <Drawer.Screen
        name="all-orders"
        options={{
          drawerLabel: t("drawer.allOrders"),
          title: t("drawer.allOrders"),
          headerShadowVisible: false,
          headerRight: () => <AllOrdersHeaderRight />,
        }}
      />
      <Drawer.Screen
        name="history"
        options={{
          drawerLabel: t("drawer.history"),
          title: t("drawer.history"),
        }}
      />
    </Drawer>
  );
}

export default function OrdersModuleLayout() {
  return (
    <OrdersModuleProvider>
      <OrdersDrawer />
    </OrdersModuleProvider>
  );
}
