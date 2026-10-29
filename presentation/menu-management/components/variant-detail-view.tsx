import { useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { router } from "expo-router";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Icon from "@/presentation/theme/components/icon";
import Button from "@/presentation/theme/components/button";
import DetailHeader from "@/presentation/theme/components/detail-header";
import Label from "@/presentation/theme/components/label";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import type { ActionsBottomSheetItem } from "@/presentation/theme/components/actions-bottom-sheet";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Roles, isValidRole } from "@/core/auth/models/user.model";
import { useMenuManagement } from "@/presentation/menu-management/hooks/useMenuManagement";
import EditVariantSheet, {
  type EditVariantSheetRef,
} from "@/presentation/menu-management/components/edit-variant-sheet";
import DuplicateVariantSheet, {
  type DuplicateVariantSheetRef,
} from "@/presentation/menu-management/components/duplicate-variant-sheet";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import {
  useVariantStockSection,
  VariantStockCards,
  VariantStockOverlays,
  openVariant,
} from "@/presentation/menu-management/components/variant-stock-section";

interface VariantDetailViewProps {
  productOptionId: number;
  /** Rendered as a pane (tablet): close button instead of back. */
  embedded?: boolean;
  onClose?: () => void;
  /** Opens the stock mode sheet on arrival, e.g. from "Gestionar stock". */
  openStockMode?: boolean;
}

/**
 * One menu variant and its stock: its own units (with movements and
 * restock / decrease, like an inventory item), or what its recipe covers
 * and each insumo's stock, or that it isn't tracked.
 */
export default function VariantDetailView({
  productOptionId,
  embedded = false,
  onClose,
  openStockMode = false,
}: VariantDetailViewProps) {
  const { t } = useTranslation("inventory");
  const products = useMenuStore((state) => state.products);
  const { user } = useAuthStore();
  // Same rule as the product screen's variant actions
  const canManageVariant = isValidRole(user?.role?.name, [
    Roles.ADMIN,
    Roles.OWNER,
  ]);
  const { updateProductOption, deleteProductOption } = useMenuManagement();
  const editSheetRef = useRef<EditVariantSheetRef>(null);
  const duplicateSheetRef = useRef<DuplicateVariantSheetRef>(null);
  const [deleteVisible, setDeleteVisible] = useState(false);

  const product = products.find((p) =>
    p.options?.some((option) => option.id === productOptionId),
  );
  const option = product?.options.find((o) => o.id === productOptionId);
  const [section, sectionSheets] = useVariantStockSection(product, option);

  // Only once: closing the sheet shouldn't bring it back
  const openedStockMode = useRef(false);
  const hasOption = !!option;
  const { canManage } = section;
  const { modeSheetRef } = sectionSheets;
  useEffect(() => {
    if (!openStockMode || !canManage || !hasOption || openedStockMode.current)
      return;
    openedStockMode.current = true;
    modeSheetRef.current?.present();
  }, [openStockMode, canManage, hasOption, modeSheetRef]);

  const Container = embedded ? ThemedView : ScreenLayout;
  const close = onClose ?? (() => router.back());

  // A product keeps at least one active variant, or it can't be sold.
  const isLastActiveOption =
    !!option?.isActive &&
    (product?.options.filter((o) => o.isActive).length ?? 0) <= 1;

  const variantActions: ActionsBottomSheetItem[] =
    canManageVariant && product && option
      ? [
          {
            icon: "square-pen",
            label: t("menuManagement:edit"),
            onPress: () => {
              sectionSheets.optionsSheetRef.current?.dismiss();
              editSheetRef.current?.present(option);
            },
          },
          {
            icon: "copy",
            label: t("menuManagement:products.variants.duplicate.action"),
            onPress: () => {
              sectionSheets.optionsSheetRef.current?.dismiss();
              duplicateSheetRef.current?.present(product, option);
            },
          },
          ...(!isLastActiveOption
            ? [
                {
                  icon: option.isActive
                    ? ("eye-off" as const)
                    : ("eye" as const),
                  label: option.isActive
                    ? t("menuManagement:deactivate")
                    : t("menuManagement:activate"),
                  onPress: () => {
                    sectionSheets.optionsSheetRef.current?.dismiss();
                    updateProductOption.mutate({
                      id: option.id,
                      productId: product.id,
                      isActive: !option.isActive,
                    });
                  },
                },
                {
                  icon: "trash" as const,
                  label: t("menuManagement:delete"),
                  color: "text-red-600",
                  onPress: () => {
                    sectionSheets.optionsSheetRef.current?.dismiss();
                    setDeleteVisible(true);
                  },
                },
              ]
            : []),
        ]
      : [];
  // Changing the stock type lives in the sheet too, for whoever manages it
  const hasOptions = section.canManage || variantActions.length > 0;
  const canAdjust = section.mode === "own" && !!section.ownItem;
  const canSetUp = section.mode === "none" && section.canManage;

  const handleConfirmDelete = async () => {
    if (!product || !option) return;
    await deleteProductOption.mutateAsync({
      id: option.id,
      productId: product.id,
    });
    setDeleteVisible(false);
    close();
  };

  if (!product || !option) {
    return (
      <Container style={tw`flex-1 px-4 pt-8 bg-background`}>
        <InventoryScreenHeader
          onBack={close}
          backIcon={embedded ? "x" : "arrow-left"}
        />
        <ThemedView style={tw`items-center py-8 gap-3`}>
          <Icon name="circle-alert" size={48} color={tw.color("gray-400")} />
          <ThemedText type="body1" style={tw`text-gray-500 text-center`}>
            {t("variant.notFound")}
          </ThemedText>
        </ThemedView>
      </Container>
    );
  }

  return (
    <Container style={tw`flex-1 bg-background`}>
      <ThemedView style={tw`px-4 ${embedded ? "pt-2" : "pt-6"} bg-transparent`}>
        <InventoryScreenHeader
          onBack={close}
          backIcon={embedded ? "x" : "arrow-left"}
        />
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 gap-4 pt-6 pb-10`}
        refreshControl={
          section.ownItemId ? (
            <RefreshControl
              refreshing={section.refreshing}
              onRefresh={section.onRefresh}
              tintColor={tw.color("primary")}
              colors={[tw.color("primary") as string]}
            />
          ) : undefined
        }
      >
        <DetailHeader
          title={section.title}
          subtitle={formatCurrency(option.price)}
          status={
            // The stock level sits in the stock cards
            !option.isActive && (
              <Label text={t("status.inactive")} size="small" />
            )
          }
          icon="hamburger"
        >
          {(canAdjust || canSetUp || hasOptions) && (
            <ThemedView style={tw`flex-row flex-wrap gap-3`}>
              {/* Stock movements are open to every role */}
              {canAdjust && (
                <>
                  <Button
                    label={t("restock")}
                    leftIcon="plus"
                    shape="rounded"
                    size="small"
                    onPress={() => section.openAdjust("restock")}
                  />
                  <Button
                    label={t("decrease")}
                    leftIcon="minus"
                    variant="surface"
                    shape="rounded"
                    size="small"
                    onPress={() => section.openAdjust("decrease")}
                  />
                </>
              )}
              {canSetUp && (
                // Not tracked: setting it up is the main action
                <Button
                  label={t("variant.manageStock")}
                  leftIcon="package"
                  shape="rounded"
                  size="small"
                  onPress={section.openModeSheet}
                />
              )}
              {hasOptions && (
                <Button
                  leftIcon="ellipsis"
                  variant="surface"
                  shape="rounded"
                  size="small"
                  accessibilityLabel={t("options")}
                  onPress={section.openOptions}
                />
              )}
            </ThemedView>
          )}
        </DetailHeader>

        <VariantStockCards section={section} />
      </ScrollView>

      <VariantStockOverlays
        section={section}
        sheets={sectionSheets}
        variantActions={variantActions}
        showModeAction
      />

      <EditVariantSheet ref={editSheetRef} productId={product.id} />

      <DuplicateVariantSheet
        ref={duplicateSheetRef}
        onDuplicated={(copyId) => openVariant(copyId)}
      />

      <DialogModal
        visible={deleteVisible}
        title={t("menuManagement:products.variants.deleteTitle")}
        message={t("menuManagement:products.variants.deleteMessage")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        loading={deleteProductOption.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteVisible(false)}
      />
    </Container>
  );
}
