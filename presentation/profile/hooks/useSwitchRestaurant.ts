import { LoginResponseDto } from "@/core/auth/dto/login.response.dto";
import { RestaurantService } from "@/core/restaurant/services/restaurant.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useMutation } from "@tanstack/react-query";
import { Alert } from "react-native";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { useContext } from "react";
import { SocketContext } from "@/presentation/shared/context/SocketContext";

export const switchRestaurantMutation = () => {
  const { changeStatus } = useAuthStore();
  const resetOrders = useOrdersStore((state) => state.reset);
  const setActiveProduct = useMenuStore((state) => state.setActiveProduct);
  const resetNewOrder = useNewOrderStore((state) => state.reset);
  const { socket, desconectarSocket, conectarSocket } = useContext(SocketContext);

  return useMutation<LoginResponseDto, unknown, string>({
    mutationFn: (restaurantId: string) =>
      RestaurantService.switchRestaurant(restaurantId),
    onSuccess: async (data) => {
      console.log(`[switchRestaurant] Switching to restaurant: ${data.currentRestaurant?.name} (${data.currentRestaurant?.id})`);

      // Update auth state with new restaurant. This also triggers bootstrap to
      // load menu, payment methods, printers, and tables for the new restaurant.
      await changeStatus(data.token, data.user, data.currentRestaurant || undefined);
      console.log("[switchRestaurant] Auth state updated and bootstrap completed");

      // Reset UI-only state from the previous restaurant
      resetOrders();
      setActiveProduct(null);
      resetNewOrder(); // Clear draft order from previous restaurant
      console.log("[switchRestaurant] UI stores reset");

      // Reconnect socket to join new restaurant room
      if (socket?.connected) {
        desconectarSocket();
        setTimeout(() => {
          conectarSocket();
        }, 100);
      }
      console.log("[switchRestaurant] Socket reconnection initiated");
    },
    onError: () => {
      Alert.alert("Error", "Could not switch restaurant. Please try again.");
    },
  });
};
