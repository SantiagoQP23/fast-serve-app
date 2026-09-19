import { ScrollView, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Roles, isValidRole } from "@/core/auth/models/user.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Card from "@/presentation/theme/components/card";
import IconButton from "@/presentation/theme/components/icon-button";
import Label from "@/presentation/theme/components/label";
import { formatCurrency } from "@/core/i18n/utils";

export default function MenuProductDetailScreen() {
  const { t } = useTranslation("menuManagement");
  const params = useLocalSearchParams<{ productId: string }>();
  const { products } = useMenu();
  const { user } = useAuthStore();
  const canManage = isValidRole(user?.role?.name, [Roles.ADMIN, Roles.OWNER]);

  const product = products.find((p) => p.id === params.productId);

  const handleEditProduct = () => {
    if (!product) return;
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

  if (!product) {
    return (
      <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
        <ThemedView style={tw`items-center gap-4 flex-row`}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => tw.style(pressed && "opacity-70")}
          >
            <Ionicons name="arrow-back-outline" size={24} />
          </Pressable>
        </ThemedView>
        <ThemedView style={tw`items-center py-8 gap-3`}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <ThemedText type="body1" style={tw`text-gray-500`}>
            {t("products.noProducts")}
          </ThemedText>
        </ThemedView>
      </ScreenLayout>
    );
  }

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
            {product.name}
          </ThemedText>
        </ThemedView>
        {canManage && (
          <IconButton
            icon="create-outline"
            size={20}
            variant="text"
            onPress={handleEditProduct}
          />
        )}
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-4 pb-8`}
      >
        <ThemedView style={tw`flex-row items-center gap-2 flex-wrap`}>
          <Label
            text={
              product.isActive ? t("active") : t("inactive")
            }
            color={product.isActive ? "success" : "default"}
            size="small"
          />
          <Label
            text={
              product.isPublic
                ? t("products.visibleToCustomers")
                : t("products.hiddenFromCustomers")
            }
            color={product.isPublic ? "info" : "default"}
            size="small"
          />
        </ThemedView>

        {product.description ? (
          <Card>
            <ThemedText type="small" style={tw`text-gray-500 mb-1`}>
              {t("products.fields.description")}
            </ThemedText>
            <ThemedText type="body2">{product.description}</ThemedText>
          </Card>
        ) : null}

        <Card>
          <ThemedView style={tw`gap-4`}>
            <ThemedView style={tw`flex-row items-center justify-between`}>
              <ThemedView style={tw`flex-row items-center gap-3`}>
                <Ionicons
                  name="pricetag-outline"
                  size={20}
                  color={tw.color("text-light-on-surface-variant")}
                />
                <ThemedText type="body2" style={tw`text-gray-500`}>
                  {t("products.fields.price")}
                </ThemedText>
              </ThemedView>
              <ThemedText type="body1">
                {formatCurrency(product.price)}
              </ThemedText>
            </ThemedView>

            {product.unitCost != null && (
              <ThemedView style={tw`flex-row items-center justify-between`}>
                <ThemedView style={tw`flex-row items-center gap-3`}>
                  <Ionicons
                    name="cash-outline"
                    size={20}
                    color={tw.color("text-light-on-surface-variant")}
                  />
                  <ThemedText type="body2" style={tw`text-gray-500`}>
                    {t("products.fields.unitCost")}
                  </ThemedText>
                </ThemedView>
                <ThemedText type="body1">
                  {formatCurrency(product.unitCost)}
                </ThemedText>
              </ThemedView>
            )}

            {product.quantity != null && (
              <ThemedView style={tw`flex-row items-center justify-between`}>
                <ThemedView style={tw`flex-row items-center gap-3`}>
                  <Ionicons
                    name="cube-outline"
                    size={20}
                    color={tw.color("text-light-on-surface-variant")}
                  />
                  <ThemedText type="body2" style={tw`text-gray-500`}>
                    {t("products.fields.quantity")}
                  </ThemedText>
                </ThemedView>
                <ThemedText type="body1">{product.quantity}</ThemedText>
              </ThemedView>
            )}

            <ThemedView style={tw`flex-row items-center justify-between`}>
              <ThemedView style={tw`flex-row items-center gap-3`}>
                <Ionicons
                  name="grid-outline"
                  size={20}
                  color={tw.color("text-light-on-surface-variant")}
                />
                <ThemedText type="body2" style={tw`text-gray-500`}>
                  {t("products.fields.category")}
                </ThemedText>
              </ThemedView>
              <ThemedText type="body1">{product.category?.name}</ThemedText>
            </ThemedView>

            {product.productionArea && (
              <ThemedView style={tw`flex-row items-center justify-between`}>
                <ThemedView style={tw`flex-row items-center gap-3`}>
                  <Ionicons
                    name="construct-outline"
                    size={20}
                    color={tw.color("text-light-on-surface-variant")}
                  />
                  <ThemedText type="body2" style={tw`text-gray-500`}>
                    {t("products.fields.productionArea")}
                  </ThemedText>
                </ThemedView>
                <ThemedText type="body1">
                  {product.productionArea.name}
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </Card>

        {product.options && product.options.length > 0 && (
          <ThemedView style={tw`gap-3`}>
            <ThemedText type="h4">{t("products.variants.title")}</ThemedText>
            {product.options.map((option, index) => (
              <Card key={option.id ?? index}>
                <ThemedView style={tw`flex-row items-center justify-between`}>
                  <ThemedView style={tw`gap-1`}>
                    <ThemedText type="body1">{option.name}</ThemedText>
                    {option.quantity != null && (
                      <ThemedText type="small" style={tw`text-gray-500`}>
                        {t("products.variants.fields.quantity")}:{" "}
                        {option.quantity}
                      </ThemedText>
                    )}
                  </ThemedView>
                  <ThemedText type="body1">
                    {formatCurrency(option.price)}
                  </ThemedText>
                </ThemedView>
              </Card>
            ))}
          </ThemedView>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}
