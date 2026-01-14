import { BottomSheetView } from "@gorhom/bottom-sheet";
import { Alert, Pressable } from "react-native";
import { Order } from "@/core/orders/models/order.model";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import { useOrders } from "../hooks/useOrders";
import { useRouter } from "expo-router";
import { useOrdersStore } from "../store/useOrdersStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { i18nAlert } from "@/core/i18n/utils";

interface OrderOptionsBottomSheetProps {
  order: Order;
  onClose?: () => void;
}

interface OptionItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
  onPress: () => void;
  disabled?: boolean;
  divider?: boolean;
}

const OrderOptionsBottomSheet = ({
  order,
  onClose,
}: OrderOptionsBottomSheetProps) => {
  const { t } = useTranslation(["common", "orders"]);
  const { mutate: updateOrder } = useOrders().updateOrder;
  const { mutate: deleteOrder } = useOrders().deleteOrder;
  const router = useRouter();
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);

  const handleCloseOrder = () => {
    Alert.alert(
      t("orders:dialogs.closeTitle"),
      t("orders:dialogs.closeMessage"),
      [
        { text: t("common:actions.cancel"), style: "cancel" },
        {
          text: t("common:actions.close"),
          style: "destructive",
          onPress: () => {
            updateOrder(
              { id: order.id, isClosed: true },
              {
                onSuccess: () => {
                  onClose?.();
                  router.replace("/(tabs)");
                },
              },
            );
          },
        },
      ],
    );
  };

  const handleDeleteOrder = () => {
    const orderCantBeDeleted =
      order.status !== OrderStatus.PENDING ||
      order.details.some((detail) => detail.qtyDelivered !== 0);

    if (orderCantBeDeleted) {
      i18nAlert(
        t("orders:deleteAlerts.cannotDelete"),
        t("orders:deleteAlerts.cannotDeleteMessage"),
      );
      return;
    }

    Alert.alert(
      t("orders:deleteAlerts.confirmDelete"),
      t("orders:deleteAlerts.confirmDeleteMessage"),
      [
        { text: t("common:actions.cancel"), style: "cancel" },
        {
          text: t("common:actions.delete"),
          style: "destructive",
          onPress: () => {
            deleteOrder(order.id, {
              onSuccess: () => {
                onClose?.();
                setActiveOrder(null);
                router.replace("/(tabs)");
              },
            });
          },
        },
      ],
    );
  };

  const handleChangeStatus = (status: OrderStatus) => {
    updateOrder(
      { id: order.id, status },
      {
        onSuccess: () => {
          onClose?.();
        },
      },
    );
  };

  const handleNavigateToPayments = () => {
    onClose?.();
    router.push(`/(order)/${order.id}/bills`);
  };

  const handleNavigateToAddProduct = () => {
    onClose?.();
    router.push("/restaurant-menu");
  };

  const orderCantBeDeleted =
    order.status !== OrderStatus.PENDING ||
    order.details.some((detail) => detail.qtyDelivered !== 0);

  const canCloseOrder = order.status === OrderStatus.DELIVERED && order.isPaid;

  const options: OptionItem[] = [
    {
      icon: "add-circle-outline",
      label: t("orders:options.addProduct"),
      onPress: handleNavigateToAddProduct,
    },
    {
      icon: "card-outline",
      label: t("orders:options.goToPayments"),
      onPress: handleNavigateToPayments,
    },
    {
      icon: "play-outline",
      label: t("orders:options.startOrder"),
      onPress: () => handleChangeStatus(OrderStatus.IN_PROGRESS),
      disabled: order.status !== OrderStatus.PENDING,
      divider: true,
    },
    {
      icon: "pause-outline",
      label: t("orders:options.pauseOrder"),
      onPress: () => handleChangeStatus(OrderStatus.PENDING),
      disabled: order.status !== OrderStatus.IN_PROGRESS,
    },
    {
      icon: "checkmark-done-outline",
      label: t("orders:options.markDelivered"),
      onPress: () => handleChangeStatus(OrderStatus.DELIVERED),
      disabled: order.status === OrderStatus.DELIVERED,
      divider: true,
    },
    {
      icon: "lock-closed-outline",
      label: t("orders:options.closeOrder"),
      onPress: handleCloseOrder,
      disabled: !canCloseOrder,
    },
    {
      icon: "trash-outline",
      label: t("orders:options.deleteOrder"),
      color: "text-red-500",
      onPress: handleDeleteOrder,
      disabled: orderCantBeDeleted,
    },
  ];

  return (
    <BottomSheetView style={tw`px-4 pb-6`}>
      <ThemedView style={tw`mb-4`}>
        <ThemedText type="h3">{t("orders:options.title")}</ThemedText>
        <ThemedText type="body2" style={tw`text-gray-500 mt-1`}>
          {t("orders:details.orderNumber", { num: order.num })}
        </ThemedText>
      </ThemedView>

      <ThemedView style={tw`gap-2`}>
        {options.map((option, index) => (
          <ThemedView key={index}>
            <Pressable
              onPress={option.onPress}
              disabled={option.disabled}
              style={({ pressed }) => [
                tw.style(
                  "flex-row items-center gap-3 p-3 rounded-xl",
                  pressed && !option.disabled && "bg-gray-100",
                  option.disabled && "opacity-40",
                ),
              ]}
            >
              <Ionicons
                name={option.icon}
                size={22}
                color={
                  option.disabled
                    ? tw.color("light-primary")
                    : option.color
                      ? tw.color(option.color.replace("text-", ""))
                      : tw.color("light-primary")
                }
              />
              <ThemedText
                type="body1"
                style={tw.style(
                  "flex-1",
                  option.color && !option.disabled && option.color,
                )}
              >
                {option.label}
              </ThemedText>
              {!option.disabled && (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={tw.color("gray-400")}
                />
              )}
            </Pressable>
            {option.divider && <ThemedView style={tw`h-px bg-gray-200 my-2`} />}
          </ThemedView>
        ))}
      </ThemedView>
    </BottomSheetView>
  );
};

export default OrderOptionsBottomSheet;
