import { Order } from "@/core/orders/models/order.model";
import OrderCard from "@/presentation/home/components/order-card";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Dimensions, FlatList } from "react-native";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

export interface OrderListProps {
  orders: Order[];
  title: string;
}
export default function OrderList({ title, orders }: OrderListProps) {
  const { t } = useTranslation(["common"]);
  const screenWidth = Dimensions.get("window").width;
  return (
    <>
      <ThemedView>
        <ThemedView style={tw`px-4 justify-between mb-4`}>
          <ThemedText type="h4">{title}</ThemedText>
          <ThemedText type="small">{t("common:labels.count")}: {orders.length}</ThemedText>
        </ThemedView>
        <FlatList
          data={orders}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <ThemedView
              style={[
                index !== orders.length - 1 && tw`mr-4`,
                { width: screenWidth * 0.8 },
              ]}
            >
              <OrderCard order={item} />
            </ThemedView>
          )}
          style={tw`pr-4`}
          contentContainerStyle={tw`px-4`}
        />
      </ThemedView>
    </>
  );
}
