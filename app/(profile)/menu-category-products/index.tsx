import { useEffect, useState } from "react";
import { ScrollView, RefreshControl, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useMenuManagement } from "@/presentation/menu-management/hooks/useMenuManagement";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Roles, isValidRole } from "@/core/auth/models/user.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Fab from "@/presentation/theme/components/fab";
import IconButton from "@/presentation/theme/components/icon-button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import SwipeableRow from "@/presentation/theme/components/swipeable-row";
import type { Product } from "@/core/menu/models/product.model";

export default function MenuCategoryProductsScreen() {
  const { t } = useTranslation("menuManagement");
  const params = useLocalSearchParams<{
    categoryId: string;
    name?: string;
    sectionId?: string;
    isActive?: string;
    isPublic?: string;
  }>();
  const { products, menuQuery } = useMenu();
  const { isLoading, isError, refetch, isRefetching } = menuQuery;
  const { deleteProduct } = useMenuManagement();
  const { user } = useAuthStore();
  const canManage = isValidRole(user?.role?.name, [Roles.ADMIN, Roles.OWNER]);
  const [productToDelete, setProductToDelete] = useState<Product | null>(
    null,
  );

  const categoryProducts = products.filter(
    (product) => product.category.id === params.categoryId,
  );

  useEffect(() => {
    if (products.length === 0) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateProduct = () => {
    router.push({
      pathname: "/(profile)/menu-product-form",
      params: { categoryId: params.categoryId },
    });
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

  const handleViewProduct = (product: Product) => {
    router.push({
      pathname: "/(profile)/menu-product-detail",
      params: { productId: product.id },
    });
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    await deleteProduct.mutateAsync(productToDelete.id);
    setProductToDelete(null);
  };

  const handleEditCategory = () => {
    router.push({
      pathname: "/(profile)/menu-category-form",
      params: {
        categoryId: params.categoryId,
        name: params.name,
        sectionId: params.sectionId,
        isActive: params.isActive,
        isPublic: params.isPublic,
      },
    });
  };

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
      <ThemedView style={tw`items-center gap-2 flex-row justify-between mb-6`}>
        <ThemedView style={tw`items-center gap-4 flex-row flex-1`}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => tw.style(pressed && "opacity-70")}
          >
            <Ionicons name="arrow-back-outline" size={24} />
          </Pressable>
          <ThemedText
            type="h3"
            style={{ fontFamily: typography.regular }}
            numberOfLines={1}
          >
            {params.name}
          </ThemedText>
        </ThemedView>
        {canManage && (
          <IconButton
            icon="create-outline"
            size={20}
            variant="text"
            onPress={handleEditCategory}
          />
        )}
      </ThemedView>

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

        {!isLoading && !isError && categoryProducts.length === 0 && (
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

        {categoryProducts.length > 0 && (
          <ThemedView style={tw`gap-4`}>
            {categoryProducts.map((product) => (
              <SwipeableRow
                key={product.id}
                onEdit={canManage ? () => handleEditProduct(product) : undefined}
                onDelete={
                  canManage ? () => setProductToDelete(product) : undefined
                }
              >
                <Card
                  onPress={() => handleViewProduct(product)}
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
                        <ThemedText type="small" style={tw`text-gray-500`}>
                          ${product.price?.toFixed(2)}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                  </ThemedView>
                </Card>
              </SwipeableRow>
            ))}
          </ThemedView>
        )}
      </ScrollView>

      {canManage && <Fab icon="add" onPress={handleCreateProduct} />}

      <DialogModal
        visible={!!productToDelete}
        title={t("products.deleteTitle")}
        message={t("products.deleteMessage")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        loading={deleteProduct.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setProductToDelete(null)}
      />
    </ScreenLayout>
  );
}
