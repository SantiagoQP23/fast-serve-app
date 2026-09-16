import { View } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import tw from "@/presentation/theme/lib/tailwind";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import OrderTicketsTab from "@/presentation/orders/components/order-tickets-tab";

export default function OrderTicketsScreen() {
  const { t } = useTranslation(["common", "orders"]);
  const order = useOrdersStore((state) => state.activeOrder);

  if (!order) {
    return (
      <ScreenLayout style={tw`flex-1 justify-center items-center`}>
        <ThemedText type="h2">{t("orders:details.noActiveOrder")}</ThemedText>
      </ScreenLayout>
    );
  }

  return (
    <View style={tw`flex-1`}>
      <ScreenLayout style={tw`flex-1`}>
        <View style={tw`flex-1 px-4 pt-6 pb-6`}>
          <OrderTicketsTab order={order} />
        </View>
      </ScreenLayout>
    </View>
  );
}
