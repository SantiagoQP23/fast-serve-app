import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import OrderBillsTab from "@/presentation/orders/components/order-bills-tab";

export default function OrderBillsScreen() {
  const { t } = useTranslation(["orders"]);
  const order = useOrdersStore((state) => state.activeOrder);

  if (!order) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText>{t("orders:details.noActiveOrder")}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScreenLayout style={tw`px-4 pt-8 flex-1`}>
      <OrderBillsTab order={order} />
    </ScreenLayout>
  );
}
