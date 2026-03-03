import { BottomSheetFlatList, BottomSheetView } from "@gorhom/bottom-sheet";
import { ActivityIndicator, ListRenderItem, Pressable } from "react-native";
import { Order } from "@/core/orders/models/order.model";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { useOrders } from "../hooks/useOrders";
import { useUsers } from "@/presentation/users/hooks/useUsers";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { User } from "@/core/auth/models/user.model";

interface ReassignOrderBottomSheetProps {
  order: Order;
  onClose?: () => void;
}

const ReassignOrderBottomSheet = ({
  order,
  onClose,
}: ReassignOrderBottomSheetProps) => {
  const { t } = useTranslation(["common", "orders"]);
  const { mutate: updateOrder } = useOrders().updateOrder;
  const { users, isLoading } = useUsers();

  const handleReassign = (user: User) => {
    updateOrder(
      { id: order.id, userId: user.id },
      {
        onSuccess: () => {
          onClose?.();
        },
      },
    );
  };

  const renderUser: ListRenderItem<User> = ({ item: user }) => {
    const isCurrentUser = user.id === order.user.id;
    return (
      <Pressable
        onPress={() => handleReassign(user)}
        style={({ pressed }) => [
          tw.style(
            "flex-row items-center gap-3 p-3 rounded-xl",
            pressed && "bg-gray-100",
            isCurrentUser && "bg-gray-50",
          ),
        ]}
      >
        <ThemedView
          style={tw`w-9 h-9 rounded-full bg-light-primary/10 items-center justify-center`}
        >
          <ThemedText type="body2" style={tw`text-light-primary font-semibold`}>
            {user.person.firstName[0]}
            {user.person.lastName[0]}
          </ThemedText>
        </ThemedView>
        <ThemedText type="body1" style={tw`flex-1`}>
          {user.person.firstName} {user.person.lastName}
        </ThemedText>
        {isCurrentUser && (
          <Ionicons
            name="checkmark"
            size={20}
            color={tw.color("light-primary")}
          />
        )}
      </Pressable>
    );
  };

  return (
    <BottomSheetView style={tw`px-4 pb-6`}>
      <ThemedView style={tw`mb-4`}>
        <ThemedText type="h3">{t("orders:options.reassignOrder")}</ThemedText>
        <ThemedText type="body2" style={tw`text-gray-500 mt-1`}>
          {t("orders:details.orderNumber", { num: order.num })}
        </ThemedText>
      </ThemedView>

      {isLoading ? (
        <ThemedView style={tw`py-8 items-center`}>
          <ActivityIndicator />
        </ThemedView>
      ) : (
        <BottomSheetFlatList
          data={users}
          keyExtractor={(item: User) => item.id}
          contentContainerStyle={tw`gap-1 pb-30`}
          renderItem={renderUser}
        />
      )}
    </BottomSheetView>
  );
};

export default ReassignOrderBottomSheet;
