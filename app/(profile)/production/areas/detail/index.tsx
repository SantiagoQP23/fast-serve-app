import { useMemo, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { type BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";
import Label from "@/presentation/theme/components/label";
import ActionsBottomSheet from "@/presentation/theme/components/actions-bottom-sheet";
import DetailHeader from "@/presentation/theme/components/detail-header";
import {
  DetailCard,
  DetailCardTitle,
} from "@/presentation/theme/components/detail-card";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import AreaPrintersBottomSheet, {
  type AreaPrintersBottomSheetRef,
} from "@/presentation/production-areas/components/area-printers-bottom-sheet";
import PrinterActionsBottomSheet, {
  type PrinterActionsBottomSheetRef,
} from "@/presentation/printers/components/printer-actions-bottom-sheet";
import { useProductionAreas } from "@/presentation/production-areas/hooks/useProductionAreas";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Roles, isValidRole } from "@/core/auth/models/user.model";

/** How many of the area's products it lists before "See all". */
const PRODUCTS_PREVIEW_LIMIT = 5;

/** One production area: its products, its printers and what to do with it. */
export default function ProductionAreaDetailScreen() {
  const { t } = useTranslation("productionAreas");
  const { areaId } = useLocalSearchParams<{ areaId: string }>();
  const {
    getAllQuery,
    productionAreas,
    updateProductionArea,
    deleteProductionArea,
  } = useProductionAreas();
  const { products: menuProducts } = useMenu();
  const { user } = useAuthStore();
  const canManage = isValidRole(user?.role?.name, [Roles.ADMIN, Roles.OWNER]);

  const [deleteVisible, setDeleteVisible] = useState(false);
  const moreSheetRef = useRef<BottomSheetMethods>(null);
  const printersSheetRef = useRef<AreaPrintersBottomSheetRef>(null);
  const printerActionsSheetRef = useRef<PrinterActionsBottomSheetRef>(null);

  const area = productionAreas.find((current) => String(current.id) === areaId);

  const products = useMemo(
    () =>
      menuProducts.filter(
        (product) => String(product.productionArea?.id) === areaId,
      ),
    [menuProducts, areaId],
  );

  const handleEdit = () => {
    if (!area) return;
    router.push({
      pathname: "/(profile)/production/areas/form",
      params: {
        areaId: String(area.id),
        name: area.name,
        description: area.description || "",
        printerIds: area.printers?.map((p) => p.id).join(",") || "",
      },
    });
  };

  const handleOpenProducts = () => {
    router.push({
      pathname: "/(profile)/production/areas/products",
      params: { areaId },
    });
  };

  const updateArea = (
    changes: Partial<{ isActive: boolean; printerIds: string[] }>,
  ) => {
    if (!area) return;
    updateProductionArea.mutate({
      id: area.id,
      name: area.name,
      description: area.description,
      isActive: area.isActive,
      printerIds: area.printers?.map((p) => p.id) ?? [],
      ...changes,
    });
  };

  const handleRemovePrinter = (printerId: string) => {
    updateArea({
      printerIds: (area?.printers ?? [])
        .filter((p) => p.id !== printerId)
        .map((p) => p.id),
    });
  };

  const handleToggleActive = () => {
    if (!area) return;
    moreSheetRef.current?.dismiss();
    updateArea({ isActive: !area.isActive });
  };

  const handleConfirmDelete = async () => {
    if (!area) return;
    await deleteProductionArea.mutateAsync(area.id);
    setDeleteVisible(false);
    router.back();
  };

  const header = (
    <ThemedView style={tw`items-center flex-row mb-6`}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t("common:actions.goBack")}
        hitSlop={12}
        style={({ pressed }) => tw.style(pressed && "opacity-70")}
      >
        <Icon name="arrow-left" color={tw.color("on-surface")} size={24} />
      </Pressable>
    </ThemedView>
  );

  if (!area) {
    return (
      <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
        {header}
        <ThemedView style={tw`items-center py-8 gap-3`}>
          {getAllQuery.isLoading ? (
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {t("loading")}
            </ThemedText>
          ) : (
            <>
              <Icon name="circle-alert" size={48} color={tw.color("red-500")} />
              <ThemedText type="body1" style={tw`text-gray-500`}>
                {t("products.notFound")}
              </ThemedText>
            </>
          )}
        </ThemedView>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
      {header}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-4 pb-8`}
        refreshControl={
          <RefreshControl
            refreshing={getAllQuery.isRefetching}
            onRefresh={getAllQuery.refetch}
            tintColor={tw.color("primary")}
            colors={[tw.color("primary") as string]}
          />
        }
      >
        <DetailHeader
          title={area.name}
          subtitle={area.description || undefined}
          status={!area.isActive && <Label text={t("inactive")} />}
          icon="package"
        >
          {canManage && (
            <ThemedView style={tw`flex-row flex-wrap gap-3`}>
              <Button
                label={t("edit")}
                leftIcon="square-pen"
                variant="surface"
                shape="rounded"
                size="small"
                onPress={handleEdit}
              />
              <Button
                leftIcon="ellipsis"
                variant="surface"
                shape="rounded"
                size="small"
                accessibilityLabel={t("common:actions.more")}
                onPress={() => moreSheetRef.current?.present()}
              />
            </ThemedView>
          )}
        </DetailHeader>

        {/* Products: a preview, the full list is one tap away */}
        <DetailCard style={tw`py-5 gap-4`}>
          <DetailCardTitle title={t("products.title")} />
          {products.length ? (
            <ThemedView>
              {products
                .slice(0, PRODUCTS_PREVIEW_LIMIT)
                .map((product, index, shown) => (
                  <ThemedView
                    key={product.id}
                    style={tw.style(
                      "flex-row items-center gap-3 py-3",
                      index < shown.length - 1 && "border-b border-divider",
                    )}
                  >
                    <ThemedText style={tw`flex-1`} numberOfLines={1}>
                      {product.name}
                    </ThemedText>
                    {!!product.category?.name && (
                      <ThemedText
                        type="small"
                        style={tw`text-gray-500 max-w-1/2`}
                        numberOfLines={1}
                      >
                        {product.category.name}
                      </ThemedText>
                    )}
                  </ThemedView>
                ))}
            </ThemedView>
          ) : (
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("products.empty")}
            </ThemedText>
          )}
          {products.length > PRODUCTS_PREVIEW_LIMIT && (
            <Button
              label={t("products.seeAll", { count: products.length })}
              variant="text"
              size="small"
              style={tw`self-start -ml-3`}
              onPress={handleOpenProducts}
            />
          )}
        </DetailCard>

        {/* Printers */}
        <DetailCard style={tw`py-5 gap-4`}>
          <DetailCardTitle title={t("fields.printers")} />
          {area.printers?.length ? (
            <ThemedView>
              {area.printers.map((printer, index, printers) => (
                <Pressable
                  key={printer.id}
                  onPress={() =>
                    printerActionsSheetRef.current?.present(printer)
                  }
                  disabled={!canManage}
                  accessibilityRole={canManage ? "button" : undefined}
                  style={({ pressed }) => [
                    tw`flex-row items-center gap-3 py-2 min-h-12`,
                    index < printers.length - 1 && tw`border-b border-divider`,
                    pressed && tw`opacity-60`,
                  ]}
                >
                  <Icon
                    name="printer"
                    size={20}
                    color={tw.color("on-surface-variant")}
                  />
                  <ThemedText style={tw`flex-1`} numberOfLines={1}>
                    {printer.name}
                  </ThemedText>
                  {canManage && (
                    <IconButton
                      icon="x"
                      size={18}
                      disabled={updateProductionArea.isPending}
                      accessibilityLabel={`${t("delete")} ${printer.name}`}
                      onPress={() => handleRemovePrinter(printer.id)}
                    />
                  )}
                </Pressable>
              ))}
            </ThemedView>
          ) : (
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("noPrintersAssigned")}
            </ThemedText>
          )}
          {canManage && (
            <Button
              label={t("printersSheet.addPrinter")}
              leftIcon="plus"
              variant="outline"
              size="small"
              onPress={() => printersSheetRef.current?.present(area)}
            />
          )}
        </DetailCard>
      </ScrollView>

      <ThemedBottomSheetModal ref={moreSheetRef} enablePanDownToClose>
        <ActionsBottomSheet
          title={area.name}
          items={[
            {
              icon: area.isActive ? "eye-off" : "eye",
              label: area.isActive ? t("deactivate") : t("activate"),
              onPress: handleToggleActive,
              disabled: updateProductionArea.isPending,
            },
            {
              icon: "trash",
              label: t("delete"),
              color: "text-red-600",
              onPress: () => {
                moreSheetRef.current?.dismiss();
                setDeleteVisible(true);
              },
            },
          ]}
        />
      </ThemedBottomSheetModal>

      <AreaPrintersBottomSheet ref={printersSheetRef} />
      <PrinterActionsBottomSheet ref={printerActionsSheetRef} />

      <DialogModal
        visible={deleteVisible}
        title={t("deleteTitle")}
        message={t("deleteMessage")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        loading={deleteProductionArea.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteVisible(false)}
      />
    </ScreenLayout>
  );
}
