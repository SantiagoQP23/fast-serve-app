import { Pressable } from "react-native";
import { useRouter } from "expo-router";
import Card from "@/presentation/theme/components/card";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useBestSellingProducts } from "@/presentation/orders/hooks/useBestSellingProducts";
import { DateRange } from "@/core/orders/enums/date-range-filter.enum";

const CARD_PREVIEW_SIZE = 5;

export default function BestSellingProductsCard({
  dateRange,
  userId,
}: {
  dateRange: DateRange;
  userId?: string;
}) {
  const { t } = useTranslation(["reports", "common"]);
  const router = useRouter();
  const { products, isLoading } = useBestSellingProducts(
    dateRange,
    CARD_PREVIEW_SIZE,
    userId,
  );

  const handleSeeAll = () => {
    router.push({
      pathname: "/(reports)/best-selling-products",
      params: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...(userId ? { userId } : {}),
      },
    });
  };

  return (
    <Card onPress={handleSeeAll}>
      <ThemedView style={tw`flex-row items-center justify-between mb-3`}>
        <ThemedText type="h4">
          {t("reports:bestSelling.products.title")}
        </ThemedText>
        <Pressable onPress={handleSeeAll} hitSlop={8}>
          <ThemedText type="small" style={tw`text-light-primary`}>
            {t("common:actions.seeAll")}
          </ThemedText>
        </Pressable>
      </ThemedView>

      {isLoading ? (
        <ThemedText type="body2" style={tw`text-gray-400 text-center py-4`}>
          {t("common:status.loading")}
        </ThemedText>
      ) : products.length > 0 ? (
        <ThemedView style={tw`gap-3`}>
          {products.map((product, index) => (
            <ThemedView
              key={`${product.productId}-${product.productOptionId ?? "none"}`}
              style={tw`flex-row items-center justify-between`}
            >
              <ThemedView style={tw`flex-row items-center gap-3 flex-1`}>
                <ThemedView
                  style={tw`w-6 h-6 rounded-full bg-light-background items-center justify-center`}
                >
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {index + 1}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={tw`gap-0.5 flex-1`}>
                  <ThemedText
                    type="body2"
                    numberOfLines={1}
                    style={{ fontFamily: typography.medium }}
                  >
                    {product.productName}
                  </ThemedText>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {product.productOptionName
                      ? `${product.categoryName} · ${product.productOptionName}`
                      : product.categoryName}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              <ThemedText type="body2" style={tw`text-gray-600`}>
                {t("reports:bestSelling.unitsSold", {
                  count: Number(product.totalSold),
                })}
              </ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
      ) : (
        <ThemedText type="body2" style={tw`text-gray-400 text-center py-4`}>
          {t("reports:bestSelling.noData")}
        </ThemedText>
      )}
    </Card>
  );
}
