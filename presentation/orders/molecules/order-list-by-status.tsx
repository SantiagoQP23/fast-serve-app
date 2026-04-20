import { Order } from "@/core/orders/models/order.model";
import OrderCard from "@/presentation/home/components/order-card";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Dimensions, FlatList, ScrollView } from "react-native";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import { useMemo, useState } from "react";
import Chip from "@/presentation/theme/components/chip";
import { Ionicons } from "@expo/vector-icons";
import OrderProductsCard from "@/presentation/home/components/order-products-card";

export interface OrderListProps {
  orders: Order[];
  showProducts?: boolean;
}

export default function OrderListByStatus({
  orders,
  showProducts = false,
}: OrderListProps) {
  const { t } = useTranslation(["common"]);
  const screenWidth = Dimensions.get("window").width;

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "all">(
    "all",
  );

  const tabs: { label: string; value: OrderStatus | "all" }[] = [
    { label: t("tables:list.filter.all"), value: "all" },
    { label: t("common:status.pending"), value: OrderStatus.PENDING },
    { label: t("common:status.inProgress"), value: OrderStatus.IN_PROGRESS },
    { label: t("common:status.delivered"), value: OrderStatus.DELIVERED },
  ];

  const filteredOrders = useMemo(() => {
    if (selectedStatus === "all") return orders;
    return orders.filter((order) => order.status === selectedStatus);
  }, [orders, selectedStatus]);

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tw`gap-2 px-4`}
      >
        {tabs.map((tab) => {
          const isActive = tab.value === selectedStatus;
          const activeOrdersCount =
            tab.value === "all"
              ? orders.length
              : orders.filter((order) => order.status === tab.value).length;

          return (
            <Chip
              key={tab.value.toString()}
              onPress={() => setSelectedStatus(tab.value)}
              selected={isActive}
              label={tab.label}
              rightContent={
                <ThemedText
                  type="small"
                  style={tw`${isActive ? "text-white" : ""}`}
                >
                  {activeOrdersCount}
                </ThemedText>
              }
            />
          );
        })}
      </ScrollView>

      {filteredOrders.length > 0 ? (
        <ThemedView style={tw`px-4`}>
          {filteredOrders.map((order) => (
            <ThemedView key={order.id}>
              {showProducts && order.status !== OrderStatus.DELIVERED ? (
                <OrderProductsCard order={order} />
              ) : (
                <OrderCard order={order} />
              )}
              {/* <OrderCard order={order} /> */}
            </ThemedView>
          ))}
        </ThemedView>
      ) : (
        <ThemedView
          style={tw`items-center justify-center flex-1 gap-4 px-4 my-8`}
        >
          <Ionicons
            name="document-text-outline"
            size={80}
            color={tw.color("gray-500")}
          />
          <ThemedText type="h3">{t("orders:list.noOrders")}</ThemedText>
          <ThemedText type="body2" style={tw`text-center max-w-xs`}>
            {t("orders:list.noOrdersDescription")}
          </ThemedText>
        </ThemedView>
      )}
    </>
  );
}
