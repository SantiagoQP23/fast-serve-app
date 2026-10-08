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
import Chip from "@/presentation/theme/components/chip";
import IconButton from "@/presentation/theme/components/icon-button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import Label from "@/presentation/theme/components/label";
import TextInput from "@/presentation/theme/components/text-input";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";
import ActionsBottomSheet from "@/presentation/theme/components/actions-bottom-sheet";
import FloatingToolbar from "@/presentation/theme/components/floating-toolbar";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { formatCurrency } from "@/core/i18n/utils";
import type { ProductOption } from "@/core/menu/models/product-optionl.model";
import { typography } from "@/constants/theme";

export default function MenuProductDetailScreen() {
  const { t } = useTranslation("menuManagement");
  const params = useLocalSearchParams<{ productId: string }>();
  const { products, categories } = useMenu();
  const {
    updateProduct,
    deleteProduct,
    createProductOption,
    updateProductOption,
    deleteProductOption,
    setDefaultProductOption,
    duplicateProduct,
  } = useMenuManagement();
  const { getAllQuery: productionAreasQuery } = useProductionAreas();
  const productionAreas = productionAreasQuery.data ?? [];
  const { user } = useAuthStore();
  const canManage = isValidRole(user?.role?.name, [Roles.ADMIN, Roles.OWNER]);
  const [productDeleteVisible, setProductDeleteVisible] = useState(false);
  const productActionsSheetRef = useRef<BottomSheetMethods>(null);
  const categoryPickerRef = useRef<BottomSheetPickerRef>(null);
  const productionAreaPickerRef = useRef<BottomSheetPickerRef>(null);
  const addOptionSheetRef = useRef<BottomSheetMethods>(null);
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPrice, setNewOptionPrice] = useState("");
  const [newOptionIsDefault, setNewOptionIsDefault] = useState(false);
  const [newOptionError, setNewOptionError] = useState("");

  const [selectedOption, setSelectedOption] = useState<ProductOption | null>(
    null,
  );
  const optionActionsSheetRef = useRef<BottomSheetMethods>(null);
  const editOptionSheetRef = useRef<BottomSheetMethods>(null);
  const [editOptionName, setEditOptionName] = useState("");
  const [editOptionPrice, setEditOptionPrice] = useState("");
  const [editOptionError, setEditOptionError] = useState("");
  const [optionToDelete, setOptionToDelete] = useState<ProductOption | null>(
    null,
  );

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

  const handleToggleProductActive = () => {
    if (!product) return;
    updateProduct.mutate({ id: product.id, isActive: !product.isActive });
  };

  const handleOpenMoreProductActions = () => {
    productActionsSheetRef.current?.present();
  };

  const handleDuplicateProduct = () => {
    if (!product) return;
    productActionsSheetRef.current?.dismiss();
    duplicateProduct.mutate(product.id, {
      onSuccess: (newProduct) => {
        router.replace({
          pathname: "/(profile)/menu-product-detail",
          params: { productId: newProduct.id },
        });
      },
    });
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

    createProductOption.mutate(
      {
        productId: product.id,
        name: trimmedName,
        price: parsedPrice,
        isDefault: newOptionIsDefault,
        trackStock: false,
      },
      {
        onSuccess: () => addOptionSheetRef.current?.dismiss(),
      },
    );
  };

  const handleOpenOptionActions = (option: ProductOption) => {
    setSelectedOption(option);
    optionActionsSheetRef.current?.present();
  };

  const closeOptionActions = () => {
    optionActionsSheetRef.current?.dismiss();
  };

  const handleMakeOptionDefault = () => {
    if (!product || !selectedOption) return;
    closeOptionActions();
    setDefaultProductOption.mutate({
      productId: product.id,
      variantId: selectedOption.id,
    });
  };

  const handleToggleOptionActive = () => {
    if (!product || !selectedOption) return;
    closeOptionActions();
    updateProductOption.mutate({
      id: selectedOption.id,
      productId: product.id,
      isActive: !selectedOption.isActive,
    });
  };

  const handleOpenEditOption = () => {
    if (!selectedOption) return;
    closeOptionActions();
    setEditOptionName(selectedOption.name);
    setEditOptionPrice(String(selectedOption.price));
    setEditOptionError("");
    editOptionSheetRef.current?.present();
  };

  const handleSaveEditOption = () => {
    if (!product || !selectedOption) return;
    const trimmedName = editOptionName.trim();
    const parsedPrice = Number(editOptionPrice);

    if (!trimmedName) {
      setEditOptionError(t("products.variants.validations.nameRequired"));
      return;
    }
    if (!editOptionPrice || Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setEditOptionError(t("products.variants.validations.priceInvalid"));
      return;
    }
    setEditOptionError("");

    updateProductOption.mutate(
      {
        id: selectedOption.id,
        productId: product.id,
        name: trimmedName,
        price: parsedPrice,
      },
      {
        onSuccess: () => editOptionSheetRef.current?.dismiss(),
      },
    );
  };

  const navigateToOptionInventory = (option: ProductOption) => {
    if (!product) return;
    router.push({
      pathname: "/(profile)/menu-product-option-inventory",
      params: {
        productOptionId: String(option.id),
        productOptionName: option.name,
        productName: product.name,
      },
    });
  };

  const handleOpenInventoryConfig = () => {
    if (!selectedOption) return;
    closeOptionActions();
    navigateToOptionInventory(selectedOption);
  };

  const handleRequestDeleteOption = () => {
    if (!selectedOption) return;
    closeOptionActions();
    setOptionToDelete(selectedOption);
  };

  const handleConfirmDeleteOption = async () => {
    if (!product || !optionToDelete) return;
    await deleteProductOption.mutateAsync({
      id: optionToDelete.id,
      productId: product.id,
    });
    setOptionToDelete(null);
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
    <View style={tw`flex-1 relative`}>
      <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
        <ThemedView style={tw`items-center flex-row mb-6`}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => tw.style(pressed && "opacity-70")}
          >
            <Ionicons name="arrow-back-outline" size={24} />
          </Pressable>
        </ThemedView>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`gap-4 pb-8`}
        >
          <ThemedView style={tw`gap-1`}>
            <ThemedView style={tw`flex-row items-center gap-2`}>
              <Label
                text={product.isActive ? t("active") : t("inactive")}
                color={product.isActive ? "success" : "default"}
              />
            </ThemedView>
            <ThemedText type="h1">{product.name}</ThemedText>
            {/* <ThemedText */}
            {/*   type="body1" */}
            {/*   style={[ */}
            {/*     tw`text-light-primary`, */}
            {/*     { fontFamily: typography.semibold }, */}
            {/*   ]} */}
            {/* > */}
            {/*   {formatCurrency(product.price)} */}
            {/* </ThemedText> */}
          </ThemedView>

          <ThemedView style={tw`flex-row items-center gap-2 flex-wrap`}>
            {/* <Label */}
            {/*   text={ */}
            {/*     product.isPublic */}
            {/*       ? t("products.visibleToCustomers") */}
            {/*       : t("products.hiddenFromCustomers") */}
            {/*   } */}
            {/*   color={product.isPublic ? "info" : "default"} */}
            {/* /> */}
            <Chip
              variant="assist"
              label={product.category?.name ?? t("products.fields.category")}
              icon="grid-outline"
              onPress={
                canManage
                  ? () => categoryPickerRef.current?.present()
                  : undefined
              }
            />
            <Chip
              variant="assist"
              label={
                product.productionArea?.name ??
                t("products.placeholders.productionArea")
              }
              icon="construct-outline"
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
                <ThemedText type="h4">
                  {t("products.variants.title")}
                </ThemedText>
                {canManage && (
                  <IconButton
                    onPress={openAddOptionSheet}
                    icon="add-outline"
                    size={24}
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
                  <ThemedText
                    type="body2"
                    style={tw`text-center text-gray-500`}
                  >
                    {t("products.variants.empty")}
                  </ThemedText>
                </ThemedView>
              ) : (
                <ThemedView style={tw`gap-3`}>
                  {product.options.map((option, index) => (
                    <Card
                      key={option.id ?? index}
                      onPress={
                        canManage
                          ? () => navigateToOptionInventory(option)
                          : undefined
                      }
                      style={[
                        tw`p-4`,
                        option.isDefault && tw`bg-light-secondary`,
                        !option.isActive && tw`opacity-50`,
                      ]}
                    >
                      <ThemedView
                        style={tw`flex-row items-center justify-between bg-transparent`}
                      >
                        <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
                          <ThemedText
                            type="body1"
                            style={
                              option.isDefault && tw`text-light-on-secondary`
                            }
                          >
                            {option.name}
                          </ThemedText>
                        </ThemedView>
                        <ThemedView
                          style={tw`flex-row items-center gap-1 bg-transparent`}
                        >
                          <ThemedText
                            type="body2"
                            style={
                              option.isDefault && tw`text-light-on-secondary`
                            }
                          >
                            {formatCurrency(option.price)}
                          </ThemedText>
                          {canManage && (
                            <IconButton
                              icon="ellipsis-vertical"
                              size={18}
                              variant="text"
                              onPress={() => handleOpenOptionActions(option)}
                            />
                          )}
                        </ThemedView>
                      </ThemedView>
                    </Card>
                  ))}
                </ThemedView>
              )}
            </ThemedView>
          )}
        </ScrollView>
      </ScreenLayout>

      {canManage && (
        <View
          style={tw`absolute bottom-8 left-0 right-0 items-center`}
          pointerEvents="box-none"
        >
          <FloatingToolbar
            items={[
              {
                icon: "create-outline",
                onPress: handleEditProduct,
              },
              {
                icon: product.isActive ? "eye-off-outline" : "eye-outline",
                onPress: handleToggleProductActive,
              },
              {
                icon: "trash-outline",
                onPress: () => setProductDeleteVisible(true),
              },
              {
                icon: "ellipsis-horizontal-outline",
                onPress: handleOpenMoreProductActions,
              },
            ]}
          />
        </View>
      )}

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
            variant="outlined"
            label={t("products.variants.fields.name")}
            placeholder={t("products.variants.placeholders.name")}
            value={newOptionName}
            onChangeText={setNewOptionName}
          />

          <TextInput
            bottomSheet
            variant="outlined"
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
            loading={createProductOption.isPending}
            disabled={createProductOption.isPending}
          />
        </BottomSheetView>
      </ThemedBottomSheetModal>

      <ThemedBottomSheetModal ref={productActionsSheetRef} enablePanDownToClose>
        <ActionsBottomSheet
          title={product.name}
          items={[
            {
              icon: "copy-outline",
              label: t("products.duplicate"),
              onPress: handleDuplicateProduct,
            },
          ]}
        />
      </ThemedBottomSheetModal>

      <ThemedBottomSheetModal ref={optionActionsSheetRef} enablePanDownToClose>
        {selectedOption && (
          <ThemedView style={tw`px-4 py-4 gap-6`}>
            <ThemedView style={tw`flex-row justify-between items-start gap-3`}>
              <ThemedView style={tw`flex-1 gap-2`}>
                <ThemedText type="h2" style={{ fontFamily: typography.medium }}>
                  {selectedOption.name}
                </ThemedText>
                <ThemedView style={tw`flex-row items-center gap-2 flex-wrap`}>
                  <ThemedView style={tw`flex-row items-center gap-1`}>
                    {/* <ThemedText type="small" style={tw`text-gray-500`}> */}
                    {/*   {formatCurrency(selectedOption.price)} */}
                    {/* </ThemedText> */}
                  </ThemedView>
                  {selectedOption.trackStock && (
                    <ThemedView style={tw`flex-row items-center gap-1`}>
                      <Ionicons
                        name="cube-outline"
                        size={16}
                        color={tw.color("text-gray-500")}
                      />
                      <ThemedText type="small" style={tw`text-gray-500`}>
                        {t("inventory:stockCount", {
                          count: selectedOption.quantity,
                        })}
                      </ThemedText>
                    </ThemedView>
                  )}
                </ThemedView>
                {selectedOption.isDefault ? (
                  <Label
                    text={t("products.variants.fields.isDefault")}
                    leftIcon="star"
                    color="primary"
                    size="small"
                  />
                ) : (
                  <Button
                    label={t("products.variants.makeDefault")}
                    leftIcon="star-outline"
                    variant="text"
                    size="small"
                    onPress={handleMakeOptionDefault}
                  />
                )}
              </ThemedView>
              <IconButton
                icon={
                  selectedOption.isActive ? "eye-outline" : "eye-off-outline"
                }
                variant="secondary"
                onPress={handleToggleOptionActive}
              />
            </ThemedView>
            <ThemedView style={tw`flex-row gap-4 items-center`}>
              <Button
                label={t("delete")}
                leftIcon="trash"
                variant="destructive"
                onPress={handleRequestDeleteOption}
              />
              <Button
                label={t("edit")}
                leftIcon="create"
                variant="secondary"
                style={tw`flex-1`}
                onPress={handleOpenEditOption}
              />
            </ThemedView>
            <Button
              label={
                (selectedOption.inventoryItems?.length ?? 0) > 0
                  ? t("products.variants.editInventory")
                  : t("products.variants.configureInventory")
              }
              leftIcon="cube-outline"
              variant="secondary"
              onPress={handleOpenInventoryConfig}
            />
          </ThemedView>
        )}
      </ThemedBottomSheetModal>

      <ThemedBottomSheetModal ref={editOptionSheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
          <ThemedText type="h3">
            {t("products.variants.editVariant")}
          </ThemedText>

          <TextInput
            bottomSheet
            variant="outlined"
            label={t("products.variants.fields.name")}
            placeholder={t("products.variants.placeholders.name")}
            value={editOptionName}
            onChangeText={setEditOptionName}
          />

          <TextInput
            bottomSheet
            variant="outlined"
            label={t("products.variants.fields.price")}
            placeholder={t("products.variants.placeholders.price")}
            value={editOptionPrice}
            onChangeText={setEditOptionPrice}
            keyboardType="decimal-pad"
          />

          {editOptionError ? (
            <ThemedText type="small" style={tw`text-red-500`}>
              {editOptionError}
            </ThemedText>
          ) : null}

          <Button
            label={t("products.save")}
            onPress={handleSaveEditOption}
            loading={updateProductOption.isPending}
            disabled={updateProductOption.isPending}
          />
        </BottomSheetView>
      </ThemedBottomSheetModal>

      <DialogModal
        visible={!!optionToDelete}
        title={t("products.variants.deleteTitle")}
        message={t("products.variants.deleteMessage")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        loading={deleteProductOption.isPending}
        onConfirm={handleConfirmDeleteOption}
        onCancel={() => setOptionToDelete(null)}
      />
    </View>
  );
}
