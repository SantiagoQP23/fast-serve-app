import { ScrollView, Text, Pressable, Alert } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import Button from "@/presentation/theme/components/button";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

export default function CachedMenuScreen() {
  const { t } = useTranslation(["cachedMenu", "auth"]);
  const { sections, categories, products, restaurantId, lastUpdated, clearMenu } =
    useMenuStore();
  const { currentRestaurant } = useAuthStore();
  const { menuQuery } = useMenu();
  const [isRefetching, setIsRefetching] = useState(false);

  const handleRefetch = async () => {
    setIsRefetching(true);
    try {
      await menuQuery.refetch();
    } finally {
      setIsRefetching(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      t("cachedMenu:clearCache.title"),
      t("cachedMenu:clearCache.message"),
      [
        {
          text: t("cachedMenu:clearCache.cancel"),
          style: "cancel",
        },
        {
          text: t("cachedMenu:clearCache.confirm"),
          style: "destructive",
          onPress: () => {
            clearMenu();
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return t("cachedMenu:noData");
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const hasCache = sections.length > 0 || categories.length > 0 || products.length > 0;

  return (
    <ThemedView style={tw`flex-1 px-4 pt-8`}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedView style={tw`gap-6 pb-8`}>
          {/* Header */}
          <ThemedView style={tw`gap-2`}>
            <ThemedText type="h1">{t("cachedMenu:title")}</ThemedText>
          </ThemedView>

          {hasCache ? (
            <>
              {/* Restaurant Info */}
              <ThemedView style={tw`gap-2`}>
                <ThemedView style={tw`flex-row items-center gap-2`}>
                  <Ionicons name="storefront" size={20} />
                  <ThemedText type="body1" style={tw`font-semibold`}>
                    {t("cachedMenu:restaurant")}:
                  </ThemedText>
                  <ThemedText type="body1">{currentRestaurant?.name}</ThemedText>
                </ThemedView>
                <ThemedView style={tw`flex-row items-center gap-2`}>
                  <Ionicons name="time-outline" size={20} />
                  <ThemedText type="body1" style={tw`font-semibold`}>
                    {t("cachedMenu:lastUpdated")}:
                  </ThemedText>
                  <ThemedText type="body2">{formatDate(lastUpdated)}</ThemedText>
                </ThemedView>
              </ThemedView>

              {/* Summary Section */}
              <ThemedView style={tw`gap-3`}>
                <ThemedText type="h3">{t("cachedMenu:summary")}</ThemedText>
                <ThemedView style={tw`bg-gray-100 dark:bg-gray-800 rounded-lg p-4 gap-3`}>
                  <ThemedView style={tw`flex-row items-center gap-3`}>
                    <Ionicons name="layers-outline" size={24} />
                    <ThemedView style={tw`flex-1`}>
                      <ThemedText type="body1" style={tw`font-semibold`}>
                        {t("cachedMenu:sections")}
                      </ThemedText>
                      <ThemedText type="body2">{sections.length}</ThemedText>
                    </ThemedView>
                  </ThemedView>

                  <ThemedView style={tw`flex-row items-center gap-3`}>
                    <Ionicons name="grid-outline" size={24} />
                    <ThemedView style={tw`flex-1`}>
                      <ThemedText type="body1" style={tw`font-semibold`}>
                        {t("cachedMenu:categories")}
                      </ThemedText>
                      <ThemedText type="body2">{categories.length}</ThemedText>
                    </ThemedView>
                  </ThemedView>

                  <ThemedView style={tw`flex-row items-center gap-3`}>
                    <Ionicons name="fast-food-outline" size={24} />
                    <ThemedView style={tw`flex-1`}>
                      <ThemedText type="body1" style={tw`font-semibold`}>
                        {t("cachedMenu:products")}
                      </ThemedText>
                      <ThemedText type="body2">{products.length}</ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              </ThemedView>

              {/* Actions */}
              <ThemedView style={tw`gap-3`}>
                <Button
                  label={isRefetching ? t("cachedMenu:refetching") : t("cachedMenu:refetch")}
                  leftIcon="refresh-outline"
                  onPress={handleRefetch}
                  disabled={isRefetching}
                  loading={isRefetching}
                />
                <Button
                  label={t("cachedMenu:clearCache.button")}
                  leftIcon="trash-outline"
                  variant="outline"
                  onPress={handleClearCache}
                />
              </ThemedView>
            </>
          ) : (
            <ThemedView style={tw`items-center justify-center gap-4 py-12`}>
              <Ionicons name="document-outline" size={64} color="#999" />
              <ThemedView style={tw`gap-2 items-center`}>
                <ThemedText type="h3">{t("cachedMenu:noCache")}</ThemedText>
                <ThemedText type="body2" style={tw`text-center text-gray-500`}>
                  {t("cachedMenu:noCacheDescription")}
                </ThemedText>
              </ThemedView>
              <Button
                label={t("cachedMenu:refetch")}
                leftIcon="refresh-outline"
                onPress={handleRefetch}
                disabled={isRefetching}
                loading={isRefetching}
              />
            </ThemedView>
          )}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}
