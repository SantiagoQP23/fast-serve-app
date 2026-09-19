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
import type { Product } from "@/core/menu/models/product.model";

export default function MenuProductsScreen() {
  const { t } = useTranslation("menuManagement");
  const { products, menuQuery } = useMenu();
  const { isLoading, isError, refetch, isRefetching } = menuQuery;
  const { user } = useAuthStore();
  const canManage = isValidRole(user?.role?.name, [Roles.ADMIN, Roles.OWNER]);

  useEffect(() => {
    if (products.length === 0) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateProduct = () => {
    router.push("/(profile)/menu-product-form");
  };

  const handleEditProduct = (product: Product) => {
    router.push({
      pathname: "/(profile)/menu-product-form",
      params: {
        productId: product.id,
        name: product.name,
        description: product.description || "",
        price: String(product.price),
        unitCost: product.unitCost != null ? String(product.unitCost) : "",
        quantity: product.quantity != null ? String(product.quantity) : "",
        categoryId: product.category.id,
        productionAreaId: product.productionArea?.id
          ? String(product.productionArea.id)
          : "",
        isActive: String(product.isActive),
        isPublic: String(product.isPublic),
        options: JSON.stringify(product.options ?? []),
      },
    });
  };

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
        {isLoading && products.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="fast-food-outline" size={48} color="#999" />
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {t("loading")}
            </ThemedText>
          </ThemedView>
        )}

        {isError && products.length === 0 && (
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

        {!isLoading && !isError && products.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="fast-food-outline" size={48} color="#999" />
            <ThemedText type="body1" style={tw`font-semibold`}>
              {t("products.noProducts")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {t("products.noProductsDescription")}
            </ThemedText>
          </ThemedView>
        )}

        {products.length > 0 && (
          <ThemedView style={tw`gap-4`}>
            {products.map((product) => (
              <Card
                key={product.id}
                onPress={canManage ? () => handleEditProduct(product) : undefined}
                style={!product.isActive && tw`opacity-50`}
              >
                <ThemedView style={tw`flex-row items-center justify-between`}>
                  <ThemedView style={tw`gap-4 flex-1 flex-row items-center`}>
                    <Ionicons
                      name="fast-food-outline"
                      size={28}
                      color={tw.color("text-light-on-surface-variant")}
                    />
                    <ThemedView style={tw`flex-1 gap-2`}>
                      <ThemedText type="h4">{product.name}</ThemedText>
                      <ThemedView style={tw`flex-row items-center gap-2 flex-wrap`}>
                        <ThemedText type="small" style={tw`text-gray-500`}>
                          {product.category?.name}
                        </ThemedText>
                        <ThemedText type="small" style={tw`text-gray-500`}>
                          •
                        </ThemedText>
                        <ThemedText type="small" style={tw`text-gray-500`}>
                          ${product.price?.toFixed(2)}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                  </ThemedView>
                  {canManage && (
                    <IconButton
                      icon="create-outline"
                      size={20}
                      variant="text"
                      onPress={() => handleEditProduct(product)}
                    />
                  )}
                </ThemedView>
              </Card>
            ))}
          </ThemedView>
        )}
      </ScrollView>

      {canManage && <Fab icon="add" onPress={handleCreateProduct} />}
    </ScreenLayout>
  );
}
