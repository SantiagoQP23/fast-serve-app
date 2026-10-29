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
import IconButton from "@/presentation/theme/components/icon-button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import Label from "@/presentation/theme/components/label";
import TextInput from "@/presentation/theme/components/text-input";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";
import ActionsBottomSheet from "@/presentation/theme/components/actions-bottom-sheet";
import Separator from "@/presentation/theme/components/separator";
import Chip from "@/presentation/theme/components/chip";
import { getSelectableTags } from "@/core/menu/models/tag.model";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { formatCurrency } from "@/core/i18n/utils";
import type { ProductOption } from "@/core/menu/models/product-optionl.model";
import { typography } from "@/constants/theme";
import ProductTagsSection from "@/presentation/menu-management/components/product-tags-section";
import { VariantRow } from "@/presentation/menu-management/components/product-variant-list";
import ProductSectionHeader from "@/presentation/menu-management/components/product-section-header";
import EditVariantSheet, {
  type EditVariantSheetRef,
} from "@/presentation/menu-management/components/edit-variant-sheet";
import DuplicateVariantSheet, {
  type DuplicateVariantSheetRef,
} from "@/presentation/menu-management/components/duplicate-variant-sheet";
import {
  openVariant as openVariantById,
  useVariantStockSection,
  VariantAdjustButtons,
  VariantStockDetails,
  VariantStockMovements,
  VariantStockOverlays,
  VariantStockOverview,
} from "@/presentation/menu-management/components/variant-stock-section";

const openVariant = (
  option: ProductOption,
  { openStockMode = false }: { openStockMode?: boolean } = {},
) => openVariantById(option.id, { openStockMode });

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

  const productActionsSheetRef = useRef<BottomSheetMethods>(null);
  const editOptionSheetRef = useRef<EditVariantSheetRef>(null);
  const duplicateOptionSheetRef = useRef<DuplicateVariantSheetRef>(null);

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
    productActionsSheetRef.current?.dismiss();
    updateProduct.mutate({ id: product.id, isActive: !product.isActive });
  };

  const handleDuplicateProduct = () => {
    if (!product) return;
    productActionsSheetRef.current?.dismiss();
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

  const handleMakeDefaultFromRow = (option: ProductOption) => {
    if (!product || option.isDefault) return;
    setDefaultProductOption.mutate({
      productId: product.id,
      variantId: option.id,
    });
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

  const titleBlock = (
    <ThemedView style={tw`gap-1`}>
      {!product.isActive && (
        <ThemedView style={tw`flex-row items-center gap-2`}>
          <Label text={t("inactive")} />
        </ThemedView>
      )}
      <ThemedText type="h1">{product.name}</ThemedText>
      {singleOption && (
        <ThemedText type="body1" style={{ fontFamily: typography.semibold }}>
          {formatCurrency(singleOption.price)}
        </ThemedText>
      )}
      {singleOption && !isDefaultOptionName(singleOption.name) && (
        <Pressable
          onPress={
            canManage
              ? () => editOptionSheetRef.current?.present(singleOption)
              : undefined
          }
          disabled={!canManage}
          accessibilityRole={canManage ? "button" : undefined}
          style={({ pressed }) =>
            tw.style("flex-row items-center gap-1.5", pressed && "opacity-70")
          }
        >
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("products.variants.singleName", {
              name: singleOption.name,
            })}
          </ThemedText>
          {canManage && (
            <Icon name="square-pen" size={14} color={tw.color("gray-500")} />
          )}
        </Pressable>
      )}
      {product.description ? (
        <ThemedText type="body2" style={tw`text-gray-500 mt-1`}>
          {product.description}
        </ThemedText>
      ) : null}
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
  );

  const properties = (
    <ThemedView style={tw`gap-3 mt-4`}>
      <ProductSectionHeader title={t("products.properties")} />
      <ThemedView style={tw`flex-row items-center gap-2 flex-wrap`}>
        <Chip
          variant="filter"
          label={product.category?.name ?? t("products.fields.category")}
          icon="layout-grid"
          onPress={
            canManage ? () => categoryPickerRef.current?.present() : undefined
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
    </ThemedView>
  );

  const productInfo = (
    <>
      {singleOption
        ? canManage && (
            <ThemedView style={tw`gap-3 mt-4`}>
              <ProductSectionHeader
                title={t("products.variants.title")}
                hint={t("products.variants.singleHint")}
                onAdd={openAddOptionSheet}
                addLabel={t("products.variants.addVariant")}
                empty
              />
            </ThemedView>
          )
        : (canManage || product.options.length > 0) && (
            <ThemedView style={tw`gap-3 mt-4`}>
              <ProductSectionHeader
                title={t("products.variants.title")}
                onAdd={canManage ? openAddOptionSheet : undefined}
                addLabel={t("products.variants.addVariant")}
                empty={product.options.length === 0}
              />

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
                <ThemedView style={tw`gap-2`}>
                  {/* One card per variant, like the menu list's product
                      card, the default star before the name */}
                  {product.options.map((option, index) => (
                    <Card
                      key={option.id ?? index}
                      onPress={() => openVariant(option)}
                      accessibilityRole="button"
                      containerStyle={tw.style(
                        !option.isActive && "opacity-50",
                      )}
                      style={tw`px-4 py-3`}
                    >
                      <VariantRow
                        option={option}
                        showName
                        leading={
                          option.isDefault ? (
                            <Icon
                              name="star"
                              size={18}
                              color={tw.color("on-secondary")}
                              accessibilityLabel={t(
                                "products.variants.fields.isDefault",
                              )}
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
                          ) : (
                            // Keeps the names lined up
                            <View style={tw`w-[18px]`} />
                          )
                        }
                      />
                    </Card>
                  ))}
                </ThemedView>
              )}
            </ThemedView>
          )}

      <ProductTagsSection product={product} canManage={canManage} />
    </>
  );

  const scrollPadding = "pb-8";

  return (
    <View style={tw`flex-1 relative`}>
      <Container style={tw`flex-1 px-4 pt-8 bg-background`}>
        <ThemedView style={tw`items-center flex-row justify-between mb-6`}>
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
          {canManage && (
            <ThemedView style={tw`flex-row items-center gap-1 -my-2 -mr-3`}>
              <IconButton
                icon="square-pen"
                onPress={handleEditProduct}
                accessibilityLabel={t("edit")}
              />
              <IconButton
                icon="ellipsis-vertical"
                onPress={() => productActionsSheetRef.current?.present()}
                accessibilityLabel={t("products.options")}
              />
            </ThemedView>
          )}
        </ThemedView>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw.style("gap-4", scrollPadding)}
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
          {titleBlock}
          {properties}
          {singleOption && (
            <>
              <ThemedView style={tw`mt-4`}>
                <ProductSectionHeader
                  title={t("products.tabs.stock")}
                  right={
                    <ThemedView style={tw`flex-row items-center -my-2 -mr-2`}>
                      {canManage && stock.mode !== "none" && (
                        <IconButton
                          icon="square-pen"
                          size={18}
                          onPress={stock.openModeSheet}
                          accessibilityLabel={t("inventory:variant.mode.title")}
                        />
                      )}
                      {(stock.hasOptions || canManage) && (
                        <IconButton
                          icon="ellipsis-vertical"
                          size={18}
                          onPress={stock.openOptions}
                          accessibilityLabel={t(
                            "inventory:variant.actions.title",
                          )}
                        />
                      )}
                    </ThemedView>
                  }
                />
              </ThemedView>
              <VariantStockOverview section={stock} />
              <VariantAdjustButtons section={stock} />
              <VariantStockDetails section={stock} showMode={false} />
              <ThemedView style={tw`mt-4`}>
                <VariantStockMovements section={stock} />
              </ThemedView>
              {/* Variants and tags below show only to managers or when
                  the product has tags. */}
              {(canManage || getSelectableTags(product.tags).length > 0) && (
                <Separator style={tw``} />
              )}
            </>
          )}
          {productInfo}
        </ScrollView>
      </Container>

      <ThemedBottomSheetModal ref={productActionsSheetRef} enablePanDownToClose>
        <ActionsBottomSheet
          title={t("products.options")}
          subtitle={product.name}
          items={[
            {
              icon: product.isActive ? "eye-off" : "eye",
              label: product.isActive ? t("deactivate") : t("activate"),
              onPress: handleToggleProductActive,
            },
            {
              icon: "copy",
              label: t("products.duplicate"),
              onPress: handleDuplicateProduct,
              disabled: duplicateProduct.isPending,
            },
            {
              icon: "trash",
              label: t("delete"),
              color: "text-red-600",
              onPress: () => {
                productActionsSheetRef.current?.dismiss();
                setProductDeleteVisible(true);
              },
            },
          ]}
        />
      </ThemedBottomSheetModal>

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

      <EditVariantSheet ref={editOptionSheetRef} productId={product.id} />

      <VariantStockOverlays
        section={stock}
        sheets={stockSheets}
        variantActions={
          canManage && singleOption
            ? [
                {
                  icon: "copy",
                  label: t("products.variants.duplicate.action"),
                  onPress: () => {
                    stockSheets.optionsSheetRef.current?.dismiss();
                    duplicateOptionSheetRef.current?.present(
                      product,
                      singleOption,
                    );
                  },
                },
              ]
            : []
        }
      />

      <DuplicateVariantSheet
        ref={duplicateOptionSheetRef}
        onDuplicated={(copyId) => openVariantById(copyId)}
      />
    </View>
  );
}
