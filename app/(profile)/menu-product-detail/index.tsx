import { Fragment, useRef, useState } from "react";
import { ScrollView, Pressable, View, StyleSheet } from "react-native";
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
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import IconButton from "@/presentation/theme/components/icon-button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import Label from "@/presentation/theme/components/label";
import Popover, {
  AnchorPosition,
} from "@/presentation/theme/components/popover";
import { formatCurrency } from "@/core/i18n/utils";

export default function MenuProductDetailScreen() {
  const { t } = useTranslation("menuManagement");
  const params = useLocalSearchParams<{ productId: string }>();
  const { products } = useMenu();
  const { updateProduct, deleteProduct } = useMenuManagement();
  const { user } = useAuthStore();
  const canManage = isValidRole(user?.role?.name, [Roles.ADMIN, Roles.OWNER]);
  const [productDeleteVisible, setProductDeleteVisible] = useState(false);
  const [productMenuVisible, setProductMenuVisible] = useState(false);
  const [productMenuAnchor, setProductMenuAnchor] =
    useState<AnchorPosition | null>(null);
  const productMenuButtonRef = useRef<View>(null);
  const dividerColor = useThemeColor(
    { light: "#e5e7eb", dark: "#374151" },
    "border" as any,
  );

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

  const handleOpenProductMenu = () => {
    productMenuButtonRef.current?.measure(
      (_x, _y, width, height, pageX, pageY) => {
        setProductMenuAnchor({ x: pageX, y: pageY, width, height });
        setProductMenuVisible(true);
      },
    );
  };

  const handleToggleProductActive = () => {
    if (!product) return;
    updateProduct.mutate({ id: product.id, isActive: !product.isActive });
  };

  const handleConfirmDeleteProduct = async () => {
    if (!product) return;
    await deleteProduct.mutateAsync(product.id);
    setProductDeleteVisible(false);
    router.back();
  };

  if (!product) {
    return (
      <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
        <ThemedView style={tw`items-center gap-4 flex-row`}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
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
          <Button
            label={t("common:actions.goBack")}
            leftIcon="arrow-back-outline"
            variant="outline"
            onPress={() => router.back()}
          />
        </ThemedView>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
      <ThemedView style={tw`items-center flex-row justify-between mb-6`}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => tw.style(pressed && "opacity-70")}
        >
          <Ionicons name="arrow-back-outline" size={24} />
        </Pressable>
        {canManage && (
          <View ref={productMenuButtonRef} collapsable={false}>
            <IconButton
              icon="ellipsis-vertical"
              size={20}
              variant="text"
              onPress={handleOpenProductMenu}
            />
          </View>
        )}
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-4 pb-8`}
      >
        <ThemedView style={tw`gap-1`}>
          <ThemedText type="h1">{product.name}</ThemedText>
          <ThemedText
            type="body1"
            style={[
              tw`text-light-primary`,
              { fontFamily: typography.semibold },
            ]}
          >
            {formatCurrency(product.price)}
          </ThemedText>
        </ThemedView>

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
            {[
              {
                key: "category",
                icon: "grid-outline" as const,
                label: t("products.fields.category"),
                value: product.category?.name,
              },
              product.productionArea && {
                key: "productionArea",
                icon: "construct-outline" as const,
                label: t("products.fields.productionArea"),
                value: product.productionArea.name,
              },
            ]
              .filter((row): row is Exclude<typeof row, false> => !!row)
              .map((row, index) => (
                <Fragment key={row.key}>
                  {index > 0 && (
                    <ThemedView
                      style={{
                        height: StyleSheet.hairlineWidth,
                        backgroundColor: dividerColor,
                      }}
                    />
                  )}
                  <ThemedView
                    style={tw`flex-row items-center justify-between`}
                  >
                    <ThemedView style={tw`flex-row items-center gap-3`}>
                      <Ionicons
                        name={row.icon}
                        size={20}
                        color={tw.color("text-light-on-surface-variant")}
                      />
                      <ThemedText type="body2" style={tw`text-gray-500`}>
                        {row.label}
                      </ThemedText>
                    </ThemedView>
                    <ThemedText type="body1">{row.value}</ThemedText>
                  </ThemedView>
                </Fragment>
              ))}
          </ThemedView>
        </Card>

        {product.options && product.options.length > 0 && (
          <ThemedView style={tw`gap-3`}>
            <ThemedText type="h4">{t("products.variants.title")}</ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={tw`gap-2`}
            >
              {product.options.map((option, index) => (
                <Pressable
                  key={option.id ?? index}
                  disabled={!canManage}
                  onPress={() =>
                    router.push({
                      pathname: "/(profile)/menu-product-option-inventory",
                      params: {
                        productOptionId: String(option.id),
                        productOptionName: option.name,
                      },
                    })
                  }
                  style={({ pressed }) => [
                    tw.style(
                      "rounded-3xl px-4 py-3 shadow-xs gap-1",
                      option.isDefault ? "bg-light-secondary" : "bg-light-surface",
                    ),
                    { minWidth: 128 },
                    pressed && canManage && tw`opacity-80`,
                  ]}
                >
                  <ThemedText
                    type="body1"
                    numberOfLines={1}
                    style={[
                      option.isDefault && tw`text-light-on-secondary`,
                      { fontFamily: typography.semibold },
                    ]}
                  >
                    {option.name}
                  </ThemedText>
                  <ThemedText
                    type="body2"
                    style={
                      option.isDefault
                        ? tw`text-light-on-secondary`
                        : tw`text-gray-500`
                    }
                  >
                    {formatCurrency(option.price)}
                  </ThemedText>
                  <ThemedView
                    style={tw`flex-row items-center gap-1 bg-transparent`}
                  >
                    {option.trackStock && (
                      <Ionicons
                        name="cube-outline"
                        size={12}
                        color={tw.color(
                          option.isDefault
                            ? "light-on-secondary"
                            : "gray-500",
                        )}
                      />
                    )}
                    <ThemedText
                      type="small"
                      style={
                        option.isDefault
                          ? tw`text-light-on-secondary/70`
                          : tw`text-gray-500`
                      }
                    >
                      {option.trackStock
                        ? t("inventory:stockCount", { count: option.quantity })
                        : t("inventory:notTracked")}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              ))}
            </ScrollView>
          </ThemedView>
        )}
      </ScrollView>

      <Popover
        visible={productMenuVisible}
        onClose={() => setProductMenuVisible(false)}
        anchor={productMenuAnchor}
        items={[
          {
            label: t("edit"),
            icon: "create-outline",
            onPress: handleEditProduct,
          },
          {
            label: product.isActive ? t("deactivate") : t("activate"),
            icon: product.isActive ? "eye-off-outline" : "eye-outline",
            onPress: handleToggleProductActive,
          },
          {
            label: t("delete"),
            icon: "trash-outline",
            onPress: () => setProductDeleteVisible(true),
          },
        ]}
      />

      <DialogModal
        visible={productDeleteVisible}
        title={t("products.deleteTitle")}
        message={t("products.deleteMessage")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        loading={deleteProduct.isPending}
        onConfirm={handleConfirmDeleteProduct}
        onCancel={() => setProductDeleteVisible(false)}
      />
    </ScreenLayout>
  );
}
