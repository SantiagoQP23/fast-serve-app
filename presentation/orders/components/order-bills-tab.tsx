import { ScrollView, RefreshControl, ActivityIndicator } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import BillCard from "@/presentation/orders/components/bill-card";
import BillLoadState from "@/presentation/orders/components/bill-load-state";
import { useBills } from "@/presentation/orders/hooks/useBills";
import { Bill } from "@/core/orders/models/bill.model";
import { Order } from "@/core/orders/models/order.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import * as Haptics from "expo-haptics";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { toast } from "sonner-native";

interface OrderBillsTabProps {
  order: Order;
}

export default function OrderBillsTab({ order }: OrderBillsTabProps) {
  const { t } = useTranslation(["common", "orders", "bills", "errors"]);
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const primaryColor = useThemeColor({}, "primary");

  const {
    data: bills,
    isLoading,
    error,
    refetch,
  } = useBills().billsByOrderQuery(order.id);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await refetch();
      if (result.isError) toast.error(t("bills:list.loadError"));
    } finally {
      setRefreshing(false);
    }
  }, [refetch, t]);

  const openBill = (bill: Bill) => {
    router.push(`/(bills)/${bill.id}`);
  };

  if (isLoading) {
    return (
      <ThemedView style={tw`flex-1 items-center pt-12`}>
        <ActivityIndicator color={primaryColor} />
      </ThemedView>
    );
  }

  if (error && !bills) {
    return (
      <BillLoadState
        error={error}
        onRetry={refetch}
        title={t("bills:list.loadError")}
        description={t("bills:loadState.errorDescription")}
      />
    );
  }

  return (
    <ScrollView
      style={tw`flex-1`}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={tw`gap-4 pt-4 pb-6 grow`}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={primaryColor}
          colors={[primaryColor]}
        />
      }
    >
      {bills?.length === 0 ? (
        <ThemedView style={tw`items-center gap-3 pt-12 px-8`}>
          <Icon name="receipt-text" size={40} color={tw.color("gray-500")} />
          <ThemedText type="h4" style={tw`text-center`}>
            {t("bills:list.noBills")}
          </ThemedText>
          <ThemedText type="body2" style={tw`text-center text-gray-500`}>
            {t("bills:list.noBillsDescription")}
          </ThemedText>
        </ThemedView>
      ) : (
        bills?.map((bill) => (
          <BillCard key={bill.id} bill={bill} onPress={() => openBill(bill)} />
        ))
      )}
    </ScrollView>
  );
}
