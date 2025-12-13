import { LoginResponseDto } from "@/core/auth/dto/login.response.dto";
import { RestaurantService } from "@/core/restaurant/services/restaurant.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useTablesStore } from "@/presentation/tables/hooks/useTablesStore";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { useContext } from "react";
import { SocketContext } from "@/presentation/shared/context/SocketContext";

export const switchRestaurantMutation = () => {
  const { changeStatus } = useAuthStore();
  const queryClient = useQueryClient();
  const resetOrders = useOrdersStore((state) => state.reset);
  const resetTables = useTablesStore((state) => state.reset);
  const resetMenu = useMenuStore((state) => state.reset);
  const resetNewOrder = useNewOrderStore((state) => state.reset);
  const { socket, desconectarSocket, conectarSocket } = useContext(SocketContext);

  return useMutation<LoginResponseDto, unknown, string>({
    mutationFn: (restaurantId: string) =>
      RestaurantService.switchRestaurant(restaurantId),
    onSuccess: async (data) => {
      console.log(`[switchRestaurant] Switching to restaurant: ${data.currentRestaurant?.name} (${data.currentRestaurant?.id})`);
      
      // Update auth state with new restaurant
      await changeStatus(data.token, data.user, data.currentRestaurant || undefined);
      console.log("[switchRestaurant] Auth state updated");
      
      // Reset UI-only stores (not data stores - those will be updated by queries)
      resetMenu(); // Only stores activeProduct, not actual menu data
      resetNewOrder(); // Clear draft order from previous restaurant
      console.log("[switchRestaurant] UI stores reset");
      
      // Invalidate all React Query caches to refetch data for new restaurant
      // This will automatically update orders and tables stores via their useEffect hooks
      await queryClient.invalidateQueries();
      console.log("[switchRestaurant] Queries invalidated");
      
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
