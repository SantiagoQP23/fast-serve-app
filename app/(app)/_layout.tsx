import { Drawer } from "expo-router/drawer";
import DrawerMenu from "@/presentation/home/components/drawer-menu";
import { OrdersModuleProvider } from "./(tabs)/(orders-module)/orders-module.context";

export default function AppLayout() {
  return (
    <OrdersModuleProvider>
      <Drawer>
        <Drawer.Screen
          name="(tabs)"
          options={{ headerShown: false, drawerLabel: "Pedidos" }}
        />
        <Drawer.Screen
          name="history"
          options={{
            headerShown: true,
            drawerLabel: "Historial",
            title: "Historial de pedidos",
            headerShadowVisible: false,
          }}
        />
        <Drawer.Screen
          name="all-orders"
          options={{
            headerShown: true,
            title: "Todos los pedidos",
            drawerLabel: "Todos los pedidos",
            headerShadowVisible: false,
          }}
        />
      </Drawer>
    </OrdersModuleProvider>
  );
}
