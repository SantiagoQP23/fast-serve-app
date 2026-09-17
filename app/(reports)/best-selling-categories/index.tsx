import { useCallback, useMemo, useState } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import Button from "@/presentation/theme/components/button";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { formatCurrency } from "@/core/i18n/utils";
import { useBestSellingCategories } from "@/presentation/orders/hooks/useBestSellingCategories";
import {
  DateRangeFilter,
  getDateRangeFor,
} from "@/core/orders/enums/date-range-filter.enum";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";

const PAGE_SIZE = 10;

export default function BestSellingCategoriesScreen() {
  const { t } = useTranslation(["reports", "common"]);
  const primaryColor = useThemeColor({}, "primary");
  const [refreshing, setRefreshing] = useState(false);
  const params = useLocalSearchParams<{
    startDate?: string;
    endDate?: string;
    userId?: string;
  }>();

  const dateRange = useMemo(
    () =>
      params.startDate && params.endDate
        ? { startDate: params.startDate, endDate: params.endDate }
        : getDateRangeFor(DateRangeFilter.TODAY),
    [params.startDate, params.endDate],
  );

  const {
    categories,
    count,
    isLoading,
    isLoadingMore,
    loadMore,
    hasMore,
    refetch,
    reset,
  } = useBestSellingCategories(dateRange, PAGE_SIZE, params.userId);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    reset();
    await refetch();
    setRefreshing(false);
  }, [refetch, reset]);

  return (
    <ScreenLayout style={tw``}>
      <ScrollView
        contentContainerStyle={tw`pb-20 px-4`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
      >
        {isLoading && categories.length === 0 ? (
          <ThemedView style={tw`py-20 items-center`}>
            <ThemedText type="body2" style={tw`text-gray-400`}>
              {t("common:status.loading")}
            </ThemedText>
          </ThemedView>
        ) : categories.length > 0 ? (
          <ThemedView
            style={tw`bg-light-surface rounded-2xl px-4 py-2 shadow-xs`}
          >
            {categories.map((category, index) => (
              <ThemedView
                key={category.categoryId}
                style={tw`flex-row items-center justify-between py-3 ${
                  index < categories.length - 1
                    ? "border-b border-light-border"
                    : ""
                }`}
              >
                <ThemedView style={tw`flex-row items-center gap-3 flex-1`}>
                  <ThemedView
                    style={tw`w-7 h-7 rounded-full bg-light-background items-center justify-center`}
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
                      {category.categoryName}
                    </ThemedText>
                    <ThemedText type="small" style={tw`text-gray-500`}>
                      {t("reports:bestSelling.unitsSold", {
                        count: Number(category.totalSold),
                      })}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                <ThemedText type="body2" style={tw`text-gray-600`}>
                  {formatCurrency(Number(category.totalAmountSold))}
                </ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        ) : (
          <ThemedView style={tw`py-20 items-center`}>
            <Ionicons
              name="pricetags-outline"
              size={64}
              color={tw.color("gray-300")}
            />
            <ThemedText type="h4" style={tw`text-gray-500 mt-4 text-center`}>
              {t("reports:bestSelling.categories.empty")}
            </ThemedText>
          </ThemedView>
        )}

        {hasMore && (
          <ThemedView style={tw`mt-4`}>
            <Button
              label={t("common:actions.loadMore")}
              variant="outline"
              loading={isLoadingMore}
              onPress={loadMore}
            />
          </ThemedView>
        )}

        {!hasMore && count > 0 && (
          <ThemedText type="small" style={tw`text-gray-400 text-center mt-4`}>
            {categories.length} / {count}
          </ThemedText>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}
