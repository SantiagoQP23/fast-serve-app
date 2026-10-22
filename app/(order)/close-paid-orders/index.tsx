import { useState } from "react";
import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import tw from "@/presentation/theme/lib/tailwind";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { CloseOrdersDto } from "@/core/orders/dto/update-order.dto";
import { useClosePaidOrders } from "@/presentation/orders/hooks/useClosePaidOrders";

/**
 * "Cerrar pedidos pagados" for owners and admins: close their own paid and
 * delivered orders, or everyone's. Picking an option closes them right away.
 */
export default function ClosePaidOrdersScreen() {
  const { t } = useTranslation(["orders"]);
  const router = useRouter();
  const { allCount, mineCount, closePaidOrders, isLoading } =
    useClosePaidOrders();
  const [pendingScope, setPendingScope] = useState<
    CloseOrdersDto["scope"] | null
  >(null);

  const close = (scope: CloseOrdersDto["scope"]) => {
    setPendingScope(scope);
    closePaidOrders(scope, () => router.back());
  };

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`grow justify-center gap-12 px-4 py-6`}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={tw` gap-2`}>
          <ThemedText type="h2" style={tw``}>
            {t("orders:closePaid.title")}
          </ThemedText>
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {t("orders:closePaid.message", { count: allCount })}
          </ThemedText>
        </ThemedView>

        <ThemedView style={tw`gap-3`}>
          <Button
            leftIcon="users"
            label={t("orders:closePaid.all", { count: allCount })}
            onPress={() => close("all")}
            loading={isLoading && pendingScope === "all"}
            disabled={isLoading || allCount === 0}
          />

          <Button
            variant="outline"
            leftIcon="user"
            label={t("orders:closePaid.onlyMine", { count: mineCount })}
            onPress={() => close("mine")}
            loading={isLoading && pendingScope === "mine"}
            disabled={isLoading || mineCount === 0}
          />
        </ThemedView>
      </ScrollView>
    </ScreenLayout>
  );
}
