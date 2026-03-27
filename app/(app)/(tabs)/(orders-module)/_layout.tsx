import { useRef } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { useRouter } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import IconButton from "@/presentation/theme/components/icon-button";
import NotificationBadge from "@/presentation/theme/components/notification-badge";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import useOrdersModuleContext from "./orders-module.context";

function MyOrdersHeaderLeft() {
  const navigation = useNavigation();

  const handleOpenDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View style={tw`ml-2`}>
      <IconButton icon="menu-outline" onPress={handleOpenDrawer} />
    </View>
  );
}

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

export default function OrdersModuleLayout() {
  const { t } = useTranslation("orders");

  return (
    <ThemedView style={tw`flex-1 bg-light-background `}>
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen
          name="my-orders"
          options={{
            headerShown: false,
            // title: t("drawer.myOrders"),
            headerShadowVisible: false,
            headerLeft: () => <MyOrdersHeaderLeft />,
            headerRight: () => <MyOrdersHeaderRight />,
          }}
        />
        <Stack.Screen
          name="all-orders"
          options={{
            title: t("drawer.allOrders"),
            headerShadowVisible: false,
            headerLeft: () => null,
            headerRight: () => <AllOrdersHeaderRight />,
          }}
        />
        <Stack.Screen
          name="history"
          options={{
            title: t("drawer.history"),
            headerLeft: () => null,
          }}
        />
      </Stack>
    </ThemedView>
  );
}
