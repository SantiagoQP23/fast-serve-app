import { Order } from "@/core/orders/models/order.model";
import OrderCard from "@/presentation/home/components/order-card";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { ScrollView } from "react-native";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import { useMemo, useState } from "react";
import Chip from "@/presentation/theme/components/chip";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import OrderProductsCard from "@/presentation/home/components/order-products-card";
import OrderCompactCard from "@/presentation/home/components/order-compact-card";

export interface OrderListProps {
  orders: Order[];
  showProducts?: boolean;
  /** "grid" shows minimal cards two per row; `showProducts` only applies to "list". */
  variant?: "list" | "grid";
}

const GRID_COLUMNS = 2;

export default function OrderListByStatus({
  orders,
  showProducts = false,
  variant = "list",
}: OrderListProps) {
  const { t } = useTranslation(["common"]);

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "all">(
    "all",
  );

  const tabs: { label: string; value: OrderStatus | "all" }[] = [
    { label: t("tables:list.filter.all"), value: "all" },
    { label: t("common:status.pending"), value: OrderStatus.PENDING },
    { label: t("common:status.inProgress"), value: OrderStatus.IN_PROGRESS },
    { label: t("common:status.ready"), value: OrderStatus.READY },
    { label: t("common:status.delivered"), value: OrderStatus.DELIVERED },
  ];

  const filteredOrders = useMemo(() => {
    const scoped =
      selectedStatus === "all"
        ? orders
        : orders.filter((order) => order.status === selectedStatus);

    return [...scoped].sort(
      (a, b) =>
        (a.deliveryTime ? new Date(a.deliveryTime).getTime() : Infinity) -
        (b.deliveryTime ? new Date(b.deliveryTime).getTime() : Infinity),
    );
  }, [orders, selectedStatus]);

  const gridRows = useMemo(() => {
    if (variant !== "grid") return [];
    const rows: Order[][] = [];
    for (let i = 0; i < filteredOrders.length; i += GRID_COLUMNS) {
      rows.push(filteredOrders.slice(i, i + GRID_COLUMNS));
    }
    return rows;
  }, [filteredOrders, variant]);

  return (
    <>
      <ScrollView
        horizontal
        // Horizontal ScrollViews default to flexGrow: 1, so inside a
        // flex-grow parent with little content the chips stretched vertically.
        style={tw`flex-grow-0`}
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
                  style={tw`${isActive ? "text-on-secondary" : ""}`}
                >
                  {activeOrdersCount}
                </ThemedText>
              }
            />
          );
        })}
      </ScrollView>

      {filteredOrders.length > 0 && variant === "grid" ? (
        <ThemedView style={tw`px-4 gap-3`}>
          {gridRows.map((row) => (
            // Cells stretch to the tallest card so each row stays even.
            <ThemedView key={row[0].id} style={tw`flex-row gap-3`}>
              {row.map((order) => (
                <ThemedView key={order.id} style={tw`flex-1`}>
                  <OrderCompactCard order={order} />
                </ThemedView>
              ))}
              {row.length < GRID_COLUMNS && <ThemedView style={tw`flex-1`} />}
            </ThemedView>
          ))}
        </ThemedView>
      ) : filteredOrders.length > 0 ? (
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
