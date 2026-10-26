import { useRef, useState } from "react";
import { RefreshControl, ScrollView, Pressable, View } from "react-native";
import { router } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
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
import { openProductForm } from "@/presentation/menu-management/utils/open-product-form";
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
import FloatingToolbar from "@/presentation/theme/components/floating-toolbar";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { formatCurrency } from "@/core/i18n/utils";
import {
  getProductOptionAvailableQuantity,
  getProductOptionStockLevel,
  getVariantStockMode,
  type ProductOption,
} from "@/core/menu/models/product-optionl.model";
import { typography } from "@/constants/theme";
import ProductTagsSection from "@/presentation/menu-management/components/product-tags-section";
import {
  openVariant as openVariantById,
  useVariantStockSection,
  VariantAdjustButtons,
  VariantStockDetails,
  VariantStockMovements,
  VariantStockOverlays,
  VariantStockOverview,
} from "@/presentation/menu-management/components/variant-stock-section";

const STOCK_TEXT_COLOR = {
  ok: "text-gray-500",
  low: "text-orange-700",
  out: "text-red-700",
};

// The variant's stock: own units, what its recipe covers, or not tracked.
function OptionStockLeft({ option }: { option: ProductOption }) {
  const { t } = useTranslation("inventory");
  const mode = getVariantStockMode(option);
  const available = getProductOptionAvailableQuantity(option);
  const level = getProductOptionStockLevel(option, available);

  if (mode === "none")
    return (
      <ThemedText type="small" style={tw`text-gray-500`}>
        {t("variant.notTracked")}
      </ThemedText>
    );

  return (
    <ThemedText type="small" style={tw`${STOCK_TEXT_COLOR[level ?? "ok"]}`}>
      {level === "out"
        ? t("variant.outOfStock")
        : mode === "own"
          ? t("variant.inStock", { count: available ?? 0 })
          : t("variant.coversShort", { count: available ?? 0 })}
    </ThemedText>
  );
}

const openVariant = (option: ProductOption) => openVariantById(option.id);

/** What a product without variants calls its only one ("Normal"). */
const isDefaultOptionName = (name: string) =>
  name.trim().toLowerCase() === "normal";

interface MenuProductDetailViewProps {
  productId: string;
  /**
   * Rendered as a pane next to the menu overview (tablet) instead of as its
   * own screen: shows a close button and stays in the pane instead of
   * navigating.
   */
  embedded?: boolean;
  onClose?: () => void;
  /** Opens another product in the same pane, e.g. after duplicating. */
  onOpenProduct?: (productId: string) => void;
}

export default function MenuProductDetailView({
  productId,
  embedded = false,
  onClose,
  onOpenProduct,
}: MenuProductDetailViewProps) {
  const { t } = useTranslation("menuManagement");
  const Container = embedded ? ThemedView : ScreenLayout;
  const close = onClose ?? (() => router.back());
  const backIcon = embedded ? "x" : "arrow-left";
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
  const categoryPickerRef = useRef<BottomSheetPickerRef>(null);
  const productionAreaPickerRef = useRef<BottomSheetPickerRef>(null);
  const addOptionSheetRef = useRef<BottomSheetMethods>(null);
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPrice, setNewOptionPrice] = useState("");
  const [newOptionIsDefault, setNewOptionIsDefault] = useState(false);
  const [currentOptionName, setCurrentOptionName] = useState("");
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

  const product = products.find((p) => p.id === productId);
  // A product with one variant shows that variant's stock right here,
  // instead of a list of one.
  const activeOptions = product?.options.filter((o) => o.isActive) ?? [];
  const singleOption = activeOptions.length === 1 ? activeOptions[0] : null;
  const [stock, stockSheets] = useVariantStockSection(
    singleOption ? product : undefined,
    singleOption ?? undefined,
  );
  // Its second variant needs the first one to have a real name.
  const needsCurrentName =
    !!singleOption &&
    (!product?.hasVariants || isDefaultOptionName(singleOption.name));

  const categoryOptions = categories.map((category) => ({
    label: category.name,
    value: category.id,
  }));

  const productionAreaOptions = productionAreas.map((area) => ({
    label: area.name,
    value: String(area.id),
  }));

  const handleEditProduct = () => {
    if (product) openProductForm(product);
  };

  const handleToggleProductActive = () => {
    if (!product) return;
    updateProduct.mutate({ id: product.id, isActive: !product.isActive });
  };

  const handleDuplicateProduct = () => {
    if (!product) return;
    duplicateProduct.mutate(product.id, {
      onSuccess: (newProduct) => {
        if (onOpenProduct) {
          onOpenProduct(newProduct.id);
          return;
        }
        router.replace({
          pathname: "/(profile)/menu/products/detail",
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
    setCurrentOptionName("");
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
    const trimmedCurrentName = currentOptionName.trim();
    if (needsCurrentName && !trimmedCurrentName) {
      setNewOptionError(t("products.variants.validations.currentNameRequired"));
      return;
    }
    const takenNames = needsCurrentName
      ? [trimmedCurrentName]
      : activeOptions.map((o) => o.name);
    if (
      takenNames.some(
        (name) => name.trim().toLowerCase() === trimmedName.toLowerCase(),
      )
    ) {
      setNewOptionError(t("products.variants.validations.sameName"));
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
        ...(needsCurrentName ? { currentOptionName: trimmedCurrentName } : {}),
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

  const handleMakeDefaultFromRow = (option: ProductOption) => {
    if (!product || option.isDefault) return;
    setDefaultProductOption.mutate({
      productId: product.id,
      variantId: option.id,
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

  const openEditOption = (option: ProductOption) => {
    setSelectedOption(option);
    setEditOptionName(option.name);
    setEditOptionPrice(String(option.price));
    setEditOptionError("");
    editOptionSheetRef.current?.present();
  };

  const handleOpenEditOption = () => {
    if (!selectedOption) return;
    closeOptionActions();
    openEditOption(selectedOption);
  };

  // A product keeps at least one active variant, or it can't be sold.
  const isLastActiveOption =
    !!selectedOption?.isActive && activeOptions.length <= 1;

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

  const handleOpenVariantFromActions = () => {
    if (!selectedOption) return;
    closeOptionActions();
    openVariant(selectedOption);
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
    close();
  };

  if (!product) {
    return (
      <Container style={tw`flex-1 px-4 pt-8 bg-background`}>
        <ThemedView style={tw`items-center gap-4 flex-row`}>
          <Pressable
            onPress={close}
            hitSlop={12}
            style={({ pressed }) => tw.style(pressed && "opacity-70")}
          >
            <Icon name={backIcon} color={tw.color("on-surface")} size={24} />
          </Pressable>
        </ThemedView>
        <ThemedView style={tw`items-center py-8 gap-3`}>
          <Icon name="circle-alert" size={48} color={tw.color("red-500")} />
          <ThemedText type="body1" style={tw`text-gray-500`}>
            {t("products.noProducts")}
          </ThemedText>
          <Button
            label={t("common:actions.goBack")}
            leftIcon="arrow-left"
            variant="outline"
            onPress={close}
          />
        </ThemedView>
      </Container>
    );
  }

  return (
    <View style={tw`flex-1 relative`}>
      <Container style={tw`flex-1 px-4 pt-8 bg-background`}>
        <ThemedView style={tw`items-center flex-row mb-6`}>
          <Pressable
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel={
              embedded ? t("common:actions.close") : t("common:actions.goBack")
            }
            hitSlop={12}
            style={({ pressed }) => tw.style(pressed && "opacity-70")}
          >
            <Icon name={backIcon} color={tw.color("on-surface")} size={24} />
          </Pressable>
        </ThemedView>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw.style(
            "gap-4",
            canManage ? "pb-28" : "pb-8",
          )}
          refreshControl={
            stock.ownItemId ? (
              <RefreshControl
                refreshing={stock.refreshing}
                onRefresh={stock.onRefresh}
                tintColor={tw.color("primary")}
                colors={[tw.color("primary") as string]}
              />
            ) : undefined
          }
        >
          <ThemedView style={tw`gap-1`}>
            <ThemedView style={tw`flex-row items-center gap-2`}>
              <Label
                text={product.isActive ? t("active") : t("inactive")}
                color={product.isActive ? "success" : "default"}
              />
            </ThemedView>
            <ThemedText type="h1">{product.name}</ThemedText>
            {singleOption && (
              <ThemedText
                type="body1"
                style={{ fontFamily: typography.semibold }}
              >
                {formatCurrency(singleOption.price)}
              </ThemedText>
            )}
            {singleOption && !isDefaultOptionName(singleOption.name) && (
              <Pressable
                onPress={
                  canManage ? () => openEditOption(singleOption) : undefined
                }
                disabled={!canManage}
                accessibilityRole={canManage ? "button" : undefined}
                style={({ pressed }) =>
                  tw.style(
                    "flex-row items-center gap-1.5",
                    pressed && "opacity-70",
                  )
                }
              >
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {t("products.variants.singleName", {
                    name: singleOption.name,
                  })}
                </ThemedText>
                {canManage && (
                  <Icon
                    name="square-pen"
                    size={14}
                    color={tw.color("gray-500")}
                  />
                )}
              </Pressable>
            )}
            {/* <ThemedText */}
            {/*   type="body1" */}
            {/*   style={[ */}
            {/*     tw`text-primary`, */}
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
              variant="filter"
              label={product.category?.name ?? t("products.fields.category")}
              icon="layout-grid"
              onPress={
                canManage
                  ? () => categoryPickerRef.current?.present()
                  : undefined
              }
            />
            <Chip
              variant="filter"
              label={
                product.productionArea?.name ??
                t("products.placeholders.productionArea")
              }
              icon="wrench"
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

          {singleOption && (
            <ThemedView style={tw`gap-4 mt-4`}>
              <ThemedView style={tw`flex-row items-center justify-between`}>
                <ThemedText type="caption">
                  {t("products.stock.title")}
                </ThemedText>
                {stock.hasOptions && (
                  <IconButton
                    icon="ellipsis-vertical"
                    size={18}
                    onPress={stock.openOptions}
                    accessibilityLabel={t("inventory:variant.actions.title")}
                    style={tw`-my-2 -mr-2`}
                  />
                )}
              </ThemedView>
              <VariantStockOverview section={stock} />
              <VariantAdjustButtons section={stock} />
              <VariantStockDetails section={stock} />
            </ThemedView>
          )}

          {singleOption
            ? canManage && (
                <ThemedView style={tw`gap-3 mt-4`}>
                  <ThemedText type="caption">
                    {t("products.variants.title")}
                  </ThemedText>
                  <ThemedText type="body2" style={tw`text-gray-500`}>
                    {t("products.variants.singleHint")}
                  </ThemedText>
                  <ThemedView style={tw`flex-row`}>
                    <Button
                      label={t("products.variants.addVariant")}
                      onPress={openAddOptionSheet}
                      variant="outline"
                      size="small"
                      leftIcon="plus"
                    />
                  </ThemedView>
                </ThemedView>
              )
            : (canManage || product.options.length > 0) && (
                <ThemedView style={tw`gap-3 mt-4`}>
                  <ThemedText type="caption">
                    {t("products.variants.title")}
                  </ThemedText>

                  {product.options.length === 0 ? (
                    <ThemedView
                      style={tw`items-center py-6 gap-2 bg-gray-50 rounded-3xl px-4`}
                    >
                      <Icon
                        name="sliders-horizontal"
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
                          containerStyle={!option.isActive && tw`opacity-50`}
                          onPress={() => openVariant(option)}
                          variant="outline"
                        >
                          <ThemedView
                            style={tw`flex-row items-center gap-3 bg-transparent`}
                          >
                            <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
                              <ThemedText
                                type="body1"
                                style={tw`font-semibold`}
                                numberOfLines={1}
                              >
                                {option.name}
                              </ThemedText>
                              <ThemedText
                                type="small"
                                style={tw`text-gray-500`}
                              >
                                {formatCurrency(option.price)}
                              </ThemedText>
                              <OptionStockLeft option={option} />
                            </ThemedView>
                            {canManage && (
                              <IconButton
                                icon="ellipsis-vertical"
                                size={18}
                                onPress={() => handleOpenOptionActions(option)}
                                accessibilityLabel={t(
                                  "products.variants.actions",
                                )}
                              />
                            )}
                            {option.isDefault ? (
                              <Icon
                                name="star"
                                size={18}
                                color={tw.color("on-secondary")}
                              />
                            ) : canManage ? (
                              <Pressable
                                onPress={() => handleMakeDefaultFromRow(option)}
                                disabled={setDefaultProductOption.isPending}
                                hitSlop={10}
                                accessibilityRole="button"
                                accessibilityLabel={t(
                                  "products.variants.makeDefault",
                                )}
                                style={({ pressed }) =>
                                  tw.style(pressed && "opacity-60")
                                }
                              >
                                <Icon
                                  name="star"
                                  size={18}
                                  color={tw.color("gray-300")}
                                />
                              </Pressable>
                            ) : null}
                          </ThemedView>
                        </Card>
                      ))}
                    </ThemedView>
                  )}

                  {canManage && (
                    <ThemedView style={tw`flex-row`}>
                      <Button
                        label={t("products.variants.addVariant")}
                        onPress={openAddOptionSheet}
                        variant="outline"
                        size="small"
                        leftIcon="plus"
                      />
                    </ThemedView>
                  )}
                </ThemedView>
              )}

          <ProductTagsSection product={product} canManage={canManage} />

          {singleOption && (
            <ThemedView style={tw`mt-4`}>
              <VariantStockMovements section={stock} />
            </ThemedView>
          )}

          {canManage && (
            <ThemedView style={tw`items-center mt-20`}>
              <Button
                label={t("delete")}
                leftIcon="trash"
                variant="text"
                size="small"
                onPress={() => setProductDeleteVisible(true)}
              />
            </ThemedView>
          )}
        </ScrollView>
      </Container>

      {canManage && (
        <View
          style={tw`absolute bottom-8 left-0 right-0 items-center`}
          pointerEvents="box-none"
        >
          <FloatingToolbar
            items={[
              {
                icon: "square-pen",
                onPress: handleEditProduct,
              },
              {
                icon: product.isActive ? "eye-off" : "eye",
                onPress: handleToggleProductActive,
              },
              {
                icon: "copy",
                onPress: handleDuplicateProduct,
                disabled: duplicateProduct.isPending,
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

          {needsCurrentName && (
            <>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("products.variants.currentNameHint")}
              </ThemedText>
              <TextInput
                bottomSheet
                label={t("products.variants.currentName")}
                placeholder={t("products.variants.currentNamePlaceholder")}
                value={currentOptionName}
                onChangeText={setCurrentOptionName}
              />
              <ThemedText type="caption">
                {t("products.variants.newVariant")}
              </ThemedText>
            </>
          )}

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
            loading={createProductOption.isPending}
            disabled={createProductOption.isPending}
          />
        </BottomSheetView>
      </ThemedBottomSheetModal>

      <ThemedBottomSheetModal ref={optionActionsSheetRef} enablePanDownToClose>
        {selectedOption && (
          <ThemedView style={tw`px-4 pb-4 gap-6`}>
            <ThemedView
              style={tw`flex-row justify-between items-start gap-3`}
            ></ThemedView>

            <ThemedView style={tw`flex-row justify-center items-start gap-3`}>
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
                </ThemedView>
              </ThemedView>

              {!isLastActiveOption && (
                <IconButton
                  icon={selectedOption.isActive ? "eye" : "eye-off"}
                  onPress={handleToggleOptionActive}
                  variant="surface"
                />
              )}
            </ThemedView>
            <Button
              label={t("products.variants.openStock")}
              leftIcon="package"
              variant="outline"
              onPress={handleOpenVariantFromActions}
            />
            <ThemedView style={tw`flex-row gap-4 items-center justify-center`}>
              {!isLastActiveOption && (
                <Button
                  leftIcon="trash"
                  label={t("delete")}
                  variant="destructive"
                  onPress={handleRequestDeleteOption}
                  size="small"
                />
              )}
              <Button
                label={t("edit")}
                leftIcon="square-pen"
                variant="surface"
                onPress={handleOpenEditOption}
                size="small"
              />
            </ThemedView>
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
            label={t("products.variants.fields.name")}
            placeholder={t("products.variants.placeholders.name")}
            value={editOptionName}
            onChangeText={setEditOptionName}
          />

          <TextInput
            bottomSheet
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

          <ThemedView style={tw`flex-row gap-4 items-center justify-end`}>
            <Button
              label={t("products.save")}
              onPress={handleSaveEditOption}
              loading={updateProductOption.isPending}
              disabled={updateProductOption.isPending}
            />
          </ThemedView>
        </BottomSheetView>
      </ThemedBottomSheetModal>

      <VariantStockOverlays section={stock} sheets={stockSheets} />

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
