import { useEffect } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Roles, isValidRole } from "@/core/auth/models/user.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Fab from "@/presentation/theme/components/fab";
import IconButton from "@/presentation/theme/components/icon-button";
import type { Category } from "@/core/menu/models/category.model";

export default function MenuCategoriesScreen() {
  const { t } = useTranslation("menuManagement");
  const { categories, products, menuQuery } = useMenu();
  const { isLoading, isError, refetch, isRefetching } = menuQuery;
  const { user } = useAuthStore();
  const canManage = isValidRole(user?.role?.name, [Roles.ADMIN, Roles.OWNER]);

  useEffect(() => {
    if (categories.length === 0) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateCategory = () => {
    router.push("/(profile)/menu-category-form");
  };

  const handleEditCategory = (category: Category) => {
    router.push({
      pathname: "/(profile)/menu-category-form",
      params: {
        categoryId: category.id,
        name: category.name,
        sectionId: category.section.id,
        isActive: String(category.isActive),
        isPublic: String(category.isPublic),
      },
    });
  };

  const getProductCount = (categoryId: string) =>
    products.filter((product) => product.category.id === categoryId).length;

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-2`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-4 pb-8`}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={tw.color("blue-500")}
            colors={[tw.color("blue-500") || "#3b82f6"]}
          />
        }
      >
        {isLoading && categories.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="pricetag-outline" size={48} color="#999" />
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {t("loading")}
            </ThemedText>
          </ThemedView>
        )}

        {isError && categories.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <ThemedText type="body1" style={tw`text-red-500`}>
              {t("loadError")}
            </ThemedText>
            <Button
              label={t("retry")}
              onPress={() => refetch()}
              variant="outline"
            />
          </ThemedView>
        )}

        {!isLoading && !isError && categories.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="pricetag-outline" size={48} color="#999" />
            <ThemedText type="body1" style={tw`font-semibold`}>
              {t("categories.noCategories")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {t("categories.noCategoriesDescription")}
            </ThemedText>
          </ThemedView>
        )}

        {categories.length > 0 && (
          <ThemedView style={tw`gap-4`}>
            {categories.map((category) => (
              <Card
                key={category.id}
                onPress={canManage ? () => handleEditCategory(category) : undefined}
                style={!category.isActive && tw`opacity-50`}
              >
                <ThemedView style={tw`flex-row items-center justify-between`}>
                  <ThemedView style={tw`gap-4 flex-1 flex-row items-center`}>
                    <Ionicons
                      name="pricetag-outline"
                      size={28}
                      color={tw.color("text-light-on-surface-variant")}
                    />
                    <ThemedView style={tw`flex-1 gap-2`}>
                      <ThemedText type="h4">{category.name}</ThemedText>
                      <ThemedView style={tw`flex-row items-center gap-2 flex-wrap`}>
                        <ThemedText type="small" style={tw`text-gray-500`}>
                          {category.section.name}
                        </ThemedText>
                        <ThemedText type="small" style={tw`text-gray-500`}>
                          •
                        </ThemedText>
                        <ThemedText type="small" style={tw`text-gray-500`}>
                          {t("categories.productCount", {
                            count: getProductCount(category.id),
                          })}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                  </ThemedView>
                  {canManage && (
                    <ThemedView style={tw`flex-row items-center`}>
                      <IconButton
                        icon="create-outline"
                        size={20}
                        variant="text"
                        onPress={() => handleEditCategory(category)}
                      />
                    </ThemedView>
                  )}
                </ThemedView>
              </Card>
            ))}
          </ThemedView>
        )}
      </ScrollView>

      {canManage && <Fab icon="add" onPress={handleCreateCategory} />}
    </ScreenLayout>
  );
}
