import { useMemo } from "react";

import { OrderType } from "@/core/orders/enums/order-type.enum";
import { Order } from "@/core/orders/models/order.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import OrderCompactCard from "@/presentation/home/components/order-compact-card";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";

const GRID_COLUMNS = 2;

/**
 * Take-away orders as compact cards, two per row, under the tables on Home.
 * Like the tables, it ignores the my/all orders scope. Hidden when empty.
 */
export default function TakeAwayOrdersSection() {
  const { t } = useTranslation(["orders"]);
  const orders = useOrdersStore((state) => state.orders);

  const rows = useMemo(() => {
    const takeAway = orders
      .filter((order) => order.type === OrderType.TAKE_AWAY)
      .sort(
        (a, b) =>
          (a.deliveryTime ? new Date(a.deliveryTime).getTime() : Infinity) -
          (b.deliveryTime ? new Date(b.deliveryTime).getTime() : Infinity),
      );
    const result: Order[][] = [];
    for (let i = 0; i < takeAway.length; i += GRID_COLUMNS) {
      result.push(takeAway.slice(i, i + GRID_COLUMNS));
    }
    return result;
  }, [orders]);

  if (rows.length === 0) return null;

  return (
    <ThemedView>
      {/* Same look as the area headers in TablesGrid */}
      <ThemedView style={tw`px-4 py-3`}>
        <ThemedText type="body1">{t("orders:details.takeAway")}</ThemedText>
      </ThemedView>
      <ThemedView style={tw`px-4 gap-3`}>
        {rows.map((row) => (
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
    </ThemedView>
  );
}
