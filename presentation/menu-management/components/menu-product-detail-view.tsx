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
import Checkbox from "@/presentation/theme/components/checkbox";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import Label from "@/presentation/theme/components/label";
import TextInput from "@/presentation/theme/components/text-input";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";
import Chip from "@/presentation/theme/components/chip";
import ActionsBottomSheet, {
  type ActionsBottomSheetItem,
} from "@/presentation/theme/components/actions-bottom-sheet";
import DetailHeader from "@/presentation/theme/components/detail-header";
import {
  DetailCard,
  DetailSectionTitle,
} from "@/presentation/theme/components/detail-card";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { formatCurrency } from "@/core/i18n/utils";
import type { ProductOption } from "@/core/menu/models/product-optionl.model";
import ProductTagsSection from "@/presentation/menu-management/components/product-tags-section";
import { VariantRow } from "@/presentation/menu-management/components/product-variant-list";
import EditVariantSheet, {
  type EditVariantSheetRef,
} from "@/presentation/menu-management/components/edit-variant-sheet";
import DuplicateVariantSheet, {
  type DuplicateVariantSheetRef,
} from "@/presentation/menu-management/components/duplicate-variant-sheet";
import {
  openVariant as openVariantById,
  useVariantStockSection,
  VariantStockCards,
  VariantStockMovements,
  VariantStockOverlays,
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
  // One ⋯ sheet: with a single variant it is the stock section's, which
  // holds the product's actions too (its stock actions close it).
  const moreSheetRef = singleOption
    ? stockSheets.optionsSheetRef
    : productActionsSheetRef;
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
    moreSheetRef.current?.dismiss();
    updateProduct.mutate({ id: product.id, isActive: !product.isActive });
  };

  const handleDuplicateProduct = () => {
    if (!product) return;
    moreSheetRef.current?.dismiss();
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

  const singleOwn = !!singleOption && stock.mode === "own" && !!stock.ownItem;
  const singleSetUp =
    !!singleOption && stock.mode === "none" && stock.canManage;
  // Stock buttons take the row when there are any; Edit moves into ⋯
  const showEditPill = canManage && !singleOwn && !singleSetUp;
  const stockPillVariant = product.isActive ? "primary" : "surface";

  // No variants yet but its stock is set up: the stock cards fill the
  // screen, so adding variants moves into ⋯ instead of its own section
  const addVariantInSheet = needsCurrentName && stock.mode !== "none";

  const productActions: ActionsBottomSheetItem[] = canManage
    ? [
        ...(!showEditPill
          ? [
              {
                icon: "square-pen" as const,
                label: t("edit"),
                onPress: () => {
                  moreSheetRef.current?.dismiss();
                  handleEditProduct();
                },
              },
            ]
          : []),
        ...(addVariantInSheet
          ? [
              {
                icon: "plus" as const,
                label: t("products.variants.addVariant"),
                onPress: () => {
                  moreSheetRef.current?.dismiss();
                  openAddOptionSheet();
                },
              },
            ]
          : []),
        // Activate lives in the header while inactive
        ...(product.isActive
          ? [
              {
                icon: "eye-off" as const,
                label: t("deactivate"),
                onPress: handleToggleProductActive,
              },
            ]
          : []),
        {
          icon: "copy",
          label: t("products.duplicate"),
          onPress: handleDuplicateProduct,
          disabled: duplicateProduct.isPending,
        },
        // Only a real variant can be duplicated; a product without
        // variants adds its second one from Variantes
        ...(singleOption && !needsCurrentName
          ? [
              {
                icon: "copy" as const,
                label: t("products.variants.duplicate.action"),
                onPress: () => {
                  moreSheetRef.current?.dismiss();
                  duplicateOptionSheetRef.current?.present(
                    product,
                    singleOption,
                  );
                },
              },
            ]
          : []),
        {
          icon: "trash",
          label: t("delete"),
          color: "text-red-600",
          onPress: () => {
            moreSheetRef.current?.dismiss();
            setProductDeleteVisible(true);
          },
        },
      ]
    : [];
  // Managers always have product actions
  const hasMoreActions =
    canManage ||
    (!!singleOption && (stock.canManage || stock.ownActions.length > 0));
  const hasPills =
    (canManage && !product.isActive) ||
    singleOwn ||
    singleSetUp ||
    showEditPill ||
    hasMoreActions;

  // A single variant's stock level sits in its stock cards
  const status = !product.isActive && (
    <Label text={t("inactive")} size="small" />
  );

  const header = (
    <DetailHeader
      title={product.name}
      subtitle={singleOption ? formatCurrency(singleOption.price) : undefined}
      status={status}
      icon="hamburger"
    >
      {hasPills && (
        <ThemedView style={tw`flex-row flex-wrap gap-3`}>
          {canManage && !product.isActive && (
            // Inactive: bringing it back is the main action
            <Button
              label={t("activate")}
              leftIcon="eye"
              shape="rounded"
              size="small"
              loading={updateProduct.isPending}
              disabled={updateProduct.isPending}
              onPress={handleToggleProductActive}
            />
          )}
          {singleOwn && (
            // Stock movements are open to every role
            <>
              <Button
                label={t("inventory:restock")}
                leftIcon="plus"
                variant={stockPillVariant}
                shape="rounded"
                size="small"
                onPress={() => stock.openAdjust("restock")}
              />
              <Button
                label={t("inventory:decrease")}
                leftIcon="minus"
                variant="surface"
                shape="rounded"
                size="small"
                onPress={() => stock.openAdjust("decrease")}
              />
            </>
          )}
          {singleSetUp && (
            <Button
              label={t("inventory:variant.manageStock")}
              leftIcon="package"
              variant={stockPillVariant}
              shape="rounded"
              size="small"
              onPress={stock.openModeSheet}
            />
          )}
          {showEditPill && (
            <Button
              label={t("edit")}
              leftIcon="square-pen"
              variant="surface"
              shape="rounded"
              size="small"
              onPress={handleEditProduct}
            />
          )}
          {hasMoreActions && (
            <Button
              leftIcon="ellipsis"
              variant="surface"
              shape="rounded"
              size="small"
              accessibilityLabel={t("products.options")}
              onPress={() => moreSheetRef.current?.present()}
            />
          )}
        </ThemedView>
      )}
    </DetailHeader>
  );

  const details = (
    <>
      <ThemedView style={tw`gap-3 mt-4`}>
        <DetailSectionTitle title={t("products.properties")} />
        {/* Chips that open their pickers, as before the cards */}
        <DetailCard style={tw`py-4`}>
          <ThemedView style={tw`flex-row items-center gap-2 flex-wrap`}>
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
            {/* A single variant's own name, when it has a real one */}
            {singleOption && !isDefaultOptionName(singleOption.name) && (
              <Chip
                variant="filter"
                label={t("products.variants.singleName", {
                  name: singleOption.name,
                })}
                icon="sliders-horizontal"
                onPress={
                  canManage
                    ? () => editOptionSheetRef.current?.present(singleOption)
                    : undefined
                }
              />
            )}
          </ThemedView>
        </DetailCard>
      </ThemedView>

      {!!product.description && (
        <ThemedView style={tw`gap-3 mt-4`}>
          <DetailSectionTitle title={t("products.fields.description")} />
          <DetailCard style={tw`py-4`}>
            <ThemedText selectable style={tw`text-gray-500`}>
              {product.description}
            </ThemedText>
          </DetailCard>
        </ThemedView>
      )}
    </>
  );

  const addVariantPrompt = (message: string) => (
    <ThemedView style={tw`items-center gap-3 py-4`}>
      <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
        {message}
      </ThemedText>
      {canManage && (
        <Button
          label={t("products.variants.addVariant")}
          leftIcon="plus"
          variant="outline"
          size="small"
          onPress={openAddOptionSheet}
        />
      )}
    </ThemedView>
  );

  const variants = singleOption
    ? // One variant: only managers see the way to add a second (in ⋯
      // when the stock cards are shown)
      canManage &&
      !addVariantInSheet && (
        <ThemedView style={tw`gap-3 mt-4`}>
          <DetailSectionTitle title={t("products.variants.title")} />
          <DetailCard style={tw`py-2`}>
            {addVariantPrompt(t("products.variants.singleHint"))}
          </DetailCard>
        </ThemedView>
      )
    : (canManage || product.options.length > 0) && (
        <ThemedView style={tw`gap-3 mt-4`}>
          <DetailSectionTitle
            title={t("products.variants.title")}
            action={
              // With none yet, the button sits in the card instead
              canManage &&
              product.options.length > 0 && (
                <Button
                  label={t("common:actions.add")}
                  accessibilityLabel={t("products.variants.addVariant")}
                  leftIcon="plus"
                  variant="outline"
                  size="extra-small"
                  onPress={openAddOptionSheet}
                />
              )
            }
          />
          <DetailCard style={tw`py-2`}>
            {product.options.length === 0
              ? addVariantPrompt(t("products.variants.empty"))
              : product.options.map((option, index) => (
                  <Pressable
                    key={option.id ?? index}
                    onPress={() => openVariant(option)}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      tw`py-3`,
                      index < product.options.length - 1 &&
                        tw`border-b border-divider`,
                      !option.isActive && tw`opacity-50`,
                      pressed && tw`opacity-60`,
                    ]}
                  >
                    <VariantRow
                      option={option}
                      showName
                      leading={
                        // The default star before the name
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
                  </Pressable>
                ))}
          </DetailCard>
        </ThemedView>
      );

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
          contentContainerStyle={tw`gap-4 pb-8`}
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
          {header}
          {details}
          {/* A single variant's stock, right under what the product is */}
          {singleOption && (
            <VariantStockCards section={stock} showMovements={false} />
          )}
          {variants}
          <ProductTagsSection product={product} canManage={canManage} />
          {/* The history is the longest, so it goes last */}
          {singleOption && <VariantStockMovements section={stock} />}
        </ScrollView>
      </Container>

      {!singleOption && (
        <ThemedBottomSheetModal
          ref={productActionsSheetRef}
          enablePanDownToClose
        >
          <ActionsBottomSheet
            title={t("products.options")}
            subtitle={product.name}
            items={productActions}
          />
        </ThemedBottomSheetModal>
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

      <EditVariantSheet ref={editOptionSheetRef} productId={product.id} />

      <VariantStockOverlays
        section={stock}
        sheets={stockSheets}
        variantActions={productActions}
        showModeAction
        optionsTitle={t("products.options")}
      />

      <DuplicateVariantSheet
        ref={duplicateOptionSheetRef}
        onDuplicated={(copyId) => openVariantById(copyId)}
      />
    </View>
  );
}
