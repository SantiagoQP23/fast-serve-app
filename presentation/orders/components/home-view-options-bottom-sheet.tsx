import { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Chip from "@/presentation/theme/components/chip";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

export type OrdersScope = "my-orders" | "all-orders";

interface HomeViewOptionsBottomSheetProps {
  ordersScope: OrdersScope;
  onOrdersScopeChange: (scope: OrdersScope) => void;
}

// Customization options for the home screen. Filters apply immediately on
// tap; more sections will be added here over time.
export default function HomeViewOptionsBottomSheet({
  ordersScope,
  onOrdersScopeChange,
}: HomeViewOptionsBottomSheetProps) {
  const { t } = useTranslation(["orders"]);

  const scopeOptions = [
    { label: t("orders:drawer.myOrders"), value: "my-orders" as const },
    { label: t("orders:drawer.allOrders"), value: "all-orders" as const },
  ];

  return (
    <BottomSheetView style={tw`p-4 pb-8`}>
      <ThemedView style={tw`w-full gap-6`}>
        <ThemedText type="h3" style={tw`text-center`}>
          {t("orders:homeOptions.title")}
        </ThemedText>

        <ThemedView style={tw`gap-2`}>
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("orders:homeOptions.ordersSection")}
          </ThemedText>
          <ThemedView style={tw`flex-row flex-wrap gap-2`}>
            {scopeOptions.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={ordersScope === option.value}
                onPress={() => onOrdersScopeChange(option.value)}
              />
            ))}
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </BottomSheetView>
  );
}
