import { useRef, useState } from "react";
import { ScrollView, Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useMenuManagement } from "@/presentation/menu-management/hooks/useMenuManagement";
import { useProductionAreas } from "@/presentation/production-areas/hooks/useProductionAreas";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Roles, isValidRole } from "@/core/auth/models/user.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Checkbox from "@/presentation/theme/components/checkbox";
import IconButton from "@/presentation/theme/components/icon-button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import Label from "@/presentation/theme/components/label";
import TextInput from "@/presentation/theme/components/text-input";
import Popover, {
  AnchorPosition,
} from "@/presentation/theme/components/popover";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { formatCurrency } from "@/core/i18n/utils";

export default function MenuProductDetailScreen() {
  const { t } = useTranslation("menuManagement");
  const params = useLocalSearchParams<{ productId: string }>();
  const { products, categories } = useMenu();
  const { updateProduct, deleteProduct } = useMenuManagement();
  const { getAllQuery: productionAreasQuery } = useProductionAreas();
  const productionAreas = productionAreasQuery.data ?? [];
  const { user } = useAuthStore();
  const canManage = isValidRole(user?.role?.name, [Roles.ADMIN, Roles.OWNER]);
  const [productDeleteVisible, setProductDeleteVisible] = useState(false);
  const [productMenuVisible, setProductMenuVisible] = useState(false);
  const [productMenuAnchor, setProductMenuAnchor] =
    useState<AnchorPosition | null>(null);
  const productMenuButtonRef = useRef<View>(null);
  const categoryPickerRef = useRef<BottomSheetPickerRef>(null);
  const productionAreaPickerRef = useRef<BottomSheetPickerRef>(null);
  const addOptionSheetRef = useRef<BottomSheetMethods>(null);
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPrice, setNewOptionPrice] = useState("");
  const [newOptionIsDefault, setNewOptionIsDefault] = useState(false);
  const [newOptionError, setNewOptionError] = useState("");

  const product = products.find((p) => p.id === params.productId);

  const categoryOptions = categories.map((category) => ({
    label: category.name,
    value: category.id,
  }));

  const productionAreaOptions = productionAreas.map((area) => ({
    label: area.name,
    value: String(area.id),
  }));

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

  const handleChangeCategory = (value: string | number) => {
    if (!product) return;
    updateProduct.mutate({ id: product.id, categoryId: String(value) });
  };

  const handleChangeProductionArea = (value: string | number) => {
    if (!product) return;
    updateProduct.mutate({ id: product.id, productionAreaId: Number(value) });
  };

  const openAddOptionSheet = () => {
    setNewOptionName("");
    setNewOptionPrice("");
    setNewOptionIsDefault(false);
    setNewOptionError("");
    addOptionSheetRef.current?.present();
  };

  const handleAddOption = () => {
    if (!product) return;
    const trimmedName = newOptionName.trim();
    const parsedPrice = Number(newOptionPrice);

    if (!trimmedName) {
      setNewOptionError(t("products.variants.validations.nameRequired"));
      return;
    }
    if (!newOptionPrice || Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setNewOptionError(t("products.variants.validations.priceInvalid"));
      return;
    }
    setNewOptionError("");

    const existingOptions = product.options.map((option) => ({
      name: option.name,
      price: option.price,
      isDefault: newOptionIsDefault ? false : option.isDefault,
      trackStock: option.trackStock,
    }));

    updateProduct.mutate(
      {
        id: product.id,
        productOptions: [
          ...existingOptions,
          {
            name: trimmedName,
            price: parsedPrice,
            isDefault: newOptionIsDefault,
            trackStock: false,
          },
        ],
      },
      {
        onSuccess: () => addOptionSheetRef.current?.dismiss(),
      },
    );
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
            text={product.isActive ? t("active") : t("inactive")}
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
          <Label
            text={product.category?.name ?? t("products.fields.category")}
            leftIcon="grid-outline"
            size="small"
            onPress={
              canManage ? () => categoryPickerRef.current?.present() : undefined
            }
          />
          <Label
            text={
              product.productionArea?.name ??
              t("products.placeholders.productionArea")
            }
            leftIcon="construct-outline"
            size="small"
            onPress={
              canManage
                ? () => productionAreaPickerRef.current?.present()
                : undefined
            }
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

        {(canManage || product.options.length > 0) && (
          <ThemedView style={tw`gap-3 mt-4`}>
            <ThemedView style={tw`flex-row items-center justify-between`}>
              <ThemedText type="h4">{t("products.variants.title")}</ThemedText>
              {canManage && (
                <Button
                  label={t("products.variants.addVariant")}
                  onPress={openAddOptionSheet}
                  variant="outline"
                  size="small"
                  leftIcon="add-outline"
                />
              )}
            </ThemedView>

            {product.options.length === 0 ? (
              <ThemedView
                style={tw`items-center py-6 gap-2 bg-gray-50 dark:bg-gray-800 rounded-3xl px-4`}
              >
                <Ionicons
                  name="options-outline"
                  size={28}
                  color={tw.color("gray-400")}
                />
                <ThemedText type="body2" style={tw`text-center text-gray-500`}>
                  {t("products.variants.empty")}
                </ThemedText>
              </ThemedView>
            ) : (
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
                        option.isDefault
                          ? "bg-light-secondary"
                          : "bg-light-surface",
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
                          ? t("inventory:stockCount", {
                              count: option.quantity,
                            })
                          : t("inventory:notTracked")}
                      </ThemedText>
                    </ThemedView>
                  </Pressable>
                ))}
              </ScrollView>
            )}
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

      <BottomSheetPicker
        ref={categoryPickerRef}
        title={t("products.fields.category")}
        options={categoryOptions}
        value={product.category?.id}
        onChange={handleChangeCategory}
      />

      <BottomSheetPicker
        ref={productionAreaPickerRef}
        title={t("products.fields.productionArea")}
        options={productionAreaOptions}
        value={
          product.productionArea?.id
            ? String(product.productionArea.id)
            : undefined
        }
        onChange={handleChangeProductionArea}
      />

      <ThemedBottomSheetModal ref={addOptionSheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
          <ThemedText type="h3">{t("products.variants.addVariant")}</ThemedText>

          <TextInput
            bottomSheet
            label={t("products.variants.fields.name")}
            placeholder={t("products.variants.placeholders.name")}
            value={newOptionName}
            onChangeText={setNewOptionName}
          />

          <TextInput
            bottomSheet
            label={t("products.variants.fields.price")}
            placeholder={t("products.variants.placeholders.price")}
            value={newOptionPrice}
            onChangeText={setNewOptionPrice}
            keyboardType="decimal-pad"
          />

          <Checkbox
            label={t("products.variants.fields.isDefault")}
            value={newOptionIsDefault}
            onValueChange={setNewOptionIsDefault}
            size="small"
          />

          {newOptionError ? (
            <ThemedText type="small" style={tw`text-red-500`}>
              {newOptionError}
            </ThemedText>
          ) : null}

          <Button
            label={t("products.variants.addVariant")}
            onPress={handleAddOption}
            loading={updateProduct.isPending}
            disabled={updateProduct.isPending}
          />
        </BottomSheetView>
      </ThemedBottomSheetModal>
    </ScreenLayout>
  );
}
