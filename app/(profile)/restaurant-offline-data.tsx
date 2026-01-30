import { ScrollView, Alert } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useTablesStore } from "@/presentation/tables/hooks/useTablesStore";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import Button from "@/presentation/theme/components/button";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useTables } from "@/presentation/tables/hooks/useTables";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

export default function RestaurantOfflineDataScreen() {
  const { t } = useTranslation(["offlineData", "auth"]);
  const { currentRestaurant } = useAuthStore();

  // Menu state
  const {
    sections,
    categories,
    products,
    lastUpdated: menuLastUpdated,
    clearMenu,
  } = useMenuStore();
  const { menuQuery } = useMenu();
  const [isRefetchingMenu, setIsRefetchingMenu] = useState(false);

  // Tables state
  const {
    tables,
    lastUpdated: tablesLastUpdated,
    clearTables,
  } = useTablesStore();
  const { tablesQuery } = useTables();
  const [isRefetchingTables, setIsRefetchingTables] = useState(false);

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return t("offlineData:noData");
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Menu handlers
  const handleRefetchMenu = async () => {
    setIsRefetchingMenu(true);
    try {
      await menuQuery.refetch();
    } finally {
      setIsRefetchingMenu(false);
    }
  };

  const handleClearMenu = () => {
    Alert.alert(
      t("offlineData:menu.clearCache.title"),
      t("offlineData:menu.clearCache.message"),
      [
        {
          text: t("offlineData:menu.clearCache.cancel"),
          style: "cancel",
        },
        {
          text: t("offlineData:menu.clearCache.confirm"),
          style: "destructive",
          onPress: () => {
            clearMenu();
          },
        },
      ],
    );
  };

  // Tables handlers
  const handleRefetchTables = async () => {
    setIsRefetchingTables(true);
    try {
      await tablesQuery.refetch();
    } finally {
      setIsRefetchingTables(false);
    }
  };

  const handleClearTables = () => {
    Alert.alert(
      t("offlineData:tables.clearCache.title"),
      t("offlineData:tables.clearCache.message"),
      [
        {
          text: t("offlineData:tables.clearCache.cancel"),
          style: "cancel",
        },
        {
          text: t("offlineData:tables.clearCache.confirm"),
          style: "destructive",
          onPress: () => {
            clearTables();
          },
        },
      ],
    );
  };

  const hasMenu =
    sections.length > 0 || categories.length > 0 || products.length > 0;
  const hasTables = tables.length > 0;

  return (
    <ThemedView style={tw`flex-1 px-4 pt-8`}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedView style={tw`gap-8 pb-8`}>
          {/* Header */}
          <ThemedView style={tw`gap-2`}>
            <ThemedText type="h1">{t("offlineData:title")}</ThemedText>
            <ThemedView style={tw`flex-row items-center gap-2`}>
              <Ionicons name="storefront-outline" size={18} />
              <ThemedText type="body1" style={tw``}>
                {currentRestaurant?.name}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Menu Section */}
          <ThemedView style={tw`gap-4`}>
            <ThemedView style={tw`flex-row items-center gap-2`}>
              <Ionicons name="restaurant-outline" size={24} />
              <ThemedText type="h2">{t("offlineData:menu.title")}</ThemedText>
            </ThemedView>

            {hasMenu ? (
              <ThemedView style={tw`gap-4`}>
                {/* Menu Info */}
                <ThemedView style={tw`gap-2`}>
                  <ThemedView style={tw`flex-row items-center gap-2`}>
                    <Ionicons name="time-outline" size={18} />
                    <ThemedText type="body2" style={tw`text-gray-500`}>
                      {t("offlineData:lastUpdated")}:{" "}
                      {formatDate(menuLastUpdated)}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                {/* Menu Summary */}
                <ThemedView
                  style={tw` dark:bg-gray-800 rounded-lg p-4 gap-3 border border-light-border`}
                >
                  <ThemedView style={tw`flex-row items-center gap-3`}>
                    <Ionicons name="layers-outline" size={20} />
                    <ThemedView style={tw`flex-1`}>
                      <ThemedText type="body2" style={tw`text-gray-500`}>
                        {t("offlineData:menu.sections")}
                      </ThemedText>
                      <ThemedText type="h4">{sections.length}</ThemedText>
                    </ThemedView>
                  </ThemedView>

                  <ThemedView style={tw`flex-row items-center gap-3`}>
                    <Ionicons name="grid-outline" size={20} />
                    <ThemedView style={tw`flex-1`}>
                      <ThemedText type="body2" style={tw`text-gray-500`}>
                        {t("offlineData:menu.categories")}
                      </ThemedText>
                      <ThemedText type="h4">{categories.length}</ThemedText>
                    </ThemedView>
                  </ThemedView>

                  <ThemedView style={tw`flex-row items-center gap-3`}>
                    <Ionicons name="fast-food-outline" size={20} />
                    <ThemedView style={tw`flex-1`}>
                      <ThemedText type="body2" style={tw`text-gray-500`}>
                        {t("offlineData:menu.products")}
                      </ThemedText>
                      <ThemedText type="h4">{products.length}</ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>

                {/* Menu Actions */}
                <ThemedView style={tw`gap-2`}>
                  <Button
                    label={
                      isRefetchingMenu
                        ? t("offlineData:menu.refetching")
                        : t("offlineData:menu.refetch")
                    }
                    leftIcon="refresh-outline"
                    onPress={handleRefetchMenu}
                    disabled={isRefetchingMenu}
                    loading={isRefetchingMenu}
                    variant="primary"
                  />
                  <Button
                    label={t("offlineData:menu.clearCache.button")}
                    leftIcon="trash-outline"
                    variant="outline"
                    onPress={handleClearMenu}
                  />
                </ThemedView>
              </ThemedView>
            ) : (
              <ThemedView
                style={tw`items-center gap-3 py-6 bg-gray-50 dark:bg-gray-900 rounded-lg`}
              >
                <Ionicons name="restaurant-outline" size={48} color="#999" />
                <ThemedView style={tw`gap-1 items-center`}>
                  <ThemedText type="body1" style={tw`font-semibold`}>
                    {t("offlineData:menu.noCache")}
                  </ThemedText>
                  <ThemedText
                    type="body2"
                    style={tw`text-center text-gray-500 px-4`}
                  >
                    {t("offlineData:menu.noCacheDescription")}
                  </ThemedText>
                </ThemedView>
                <Button
                  label={
                    isRefetchingMenu
                      ? t("offlineData:menu.loading")
                      : t("offlineData:menu.loadButton")
                  }
                  leftIcon="cloud-download-outline"
                  onPress={handleRefetchMenu}
                  disabled={isRefetchingMenu}
                  loading={isRefetchingMenu}
                />
              </ThemedView>
            )}
          </ThemedView>

          {/* Divider */}
          <ThemedView style={tw`h-px bg-gray-200 dark:bg-gray-700`} />

          {/* Tables Section */}
          <ThemedView style={tw`gap-4`}>
            <ThemedView style={tw`flex-row items-center gap-2`}>
              <Ionicons name="grid-outline" size={24} />
              <ThemedText type="h2">{t("offlineData:tables.title")}</ThemedText>
            </ThemedView>

            {hasTables ? (
              <ThemedView style={tw`gap-4`}>
                {/* Tables Info */}
                <ThemedView style={tw`gap-2`}>
                  <ThemedView style={tw`flex-row items-center gap-2`}>
                    <Ionicons name="time-outline" size={18} />
                    <ThemedText type="body2" style={tw`text-gray-500`}>
                      {t("offlineData:lastUpdated")}:{" "}
                      {formatDate(tablesLastUpdated)}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                {/* Tables Summary */}
                <ThemedView
                  style={tw` dark:bg-gray-800 rounded-lg p-4 gap-3 border border-light-border`}
                >
                  <ThemedView style={tw`flex-row items-center gap-3`}>
                    <Ionicons name="grid-outline" size={20} />
                    <ThemedView style={tw`flex-1`}>
                      <ThemedText type="body2" style={tw`text-gray-500`}>
                        {t("offlineData:tables.totalTables")}
                      </ThemedText>
                      <ThemedText type="h4">{tables.length}</ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>

                {/* Tables Actions */}
                <ThemedView style={tw`gap-2`}>
                  <Button
                    label={
                      isRefetchingTables
                        ? t("offlineData:tables.refetching")
                        : t("offlineData:tables.refetch")
                    }
                    leftIcon="refresh-outline"
                    onPress={handleRefetchTables}
                    disabled={isRefetchingTables}
                    loading={isRefetchingTables}
                    variant="primary"
                  />
                  <Button
                    label={t("offlineData:tables.clearCache.button")}
                    leftIcon="trash-outline"
                    variant="outline"
                    onPress={handleClearTables}
                  />
                </ThemedView>
              </ThemedView>
            ) : (
              <ThemedView
                style={tw`items-center gap-3 py-6 bg-gray-50 dark:bg-gray-900 rounded-lg`}
              >
                <Ionicons name="grid-outline" size={48} color="#999" />
                <ThemedView style={tw`gap-1 items-center`}>
                  <ThemedText type="body1" style={tw`font-semibold`}>
                    {t("offlineData:tables.noCache")}
                  </ThemedText>
                  <ThemedText
                    type="body2"
                    style={tw`text-center text-gray-500 px-4`}
                  >
                    {t("offlineData:tables.noCacheDescription")}
                  </ThemedText>
                </ThemedView>
                <Button
                  label={
                    isRefetchingTables
                      ? t("offlineData:tables.loading")
                      : t("offlineData:tables.loadButton")
                  }
                  leftIcon="cloud-download-outline"
                  onPress={handleRefetchTables}
                  disabled={isRefetchingTables}
                  loading={isRefetchingTables}
                />
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}
