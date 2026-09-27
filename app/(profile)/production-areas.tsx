import { useRef, useState } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { type BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useProductionAreas } from "@/presentation/production-areas/hooks/useProductionAreas";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Roles, isValidRole } from "@/core/auth/models/user.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Fab from "@/presentation/theme/components/fab";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import IconButton from "@/presentation/theme/components/icon-button";
import type { ProductionArea } from "@/core/menu/models/producion-area.model";
import { typography } from "@/constants/theme";

export default function ProductionAreasScreen() {
  const { t } = useTranslation("productionAreas");
  const { getAllQuery, productionAreas, updateProductionArea, deleteProductionArea } =
    useProductionAreas();
  const { isLoading, isError, refetch, isRefetching } = getAllQuery;
  const { user } = useAuthStore();
  const canManage = isValidRole(user?.role?.name, [Roles.ADMIN, Roles.OWNER]);

  const [areaToDelete, setAreaToDelete] = useState<ProductionArea | null>(null);
  const [selectedArea, setSelectedArea] = useState<ProductionArea | null>(
    null,
  );
  const actionsSheetRef = useRef<BottomSheetMethods>(null);

  const handleCreateArea = () => {
    router.push("/(profile)/production-area-form");
  };

  const handleEditArea = (area: ProductionArea) => {
    router.push({
      pathname: "/(profile)/production-area-form",
      params: {
        areaId: String(area.id),
        name: area.name,
        description: area.description || "",
        printerIds: area.printers?.map((p) => p.id).join(",") || "",
      },
    });
  };

  const handleOpenAreaActions = (area: ProductionArea) => {
    setSelectedArea(area);
    actionsSheetRef.current?.present();
  };

  const handleCloseAreaActions = () => {
    actionsSheetRef.current?.dismiss();
  };

  const handleToggleActive = () => {
    if (!selectedArea) return;
    updateProductionArea.mutate({
      id: selectedArea.id,
      name: selectedArea.name,
      description: selectedArea.description,
      printerIds: selectedArea.printers?.map((p) => p.id) || [],
      isActive: !selectedArea.isActive,
    });
    handleCloseAreaActions();
  };

  const handleConfirmDelete = async () => {
    if (!areaToDelete) return;
    await deleteProductionArea.mutateAsync(areaToDelete.id);
    setAreaToDelete(null);
  };

  const getPrinterCountText = (count: number) => {
    return t("printerCount", { count });
  };

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-2`}>
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
        {isLoading && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="cube-outline" size={48} color="#999" />
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {t("loading")}
            </ThemedText>
          </ThemedView>
        )}

        {isError && (
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

        {!isLoading && !isError && productionAreas.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="cube-outline" size={48} color="#999" />
            <ThemedText type="body1" style={tw`font-semibold`}>
              {t("noAreas")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {t("noAreasDescription")}
            </ThemedText>
          </ThemedView>
        )}

        {!isLoading && !isError && productionAreas.length > 0 && (
          <ThemedView style={tw`gap-4`}>
            {productionAreas.map((area) => (
              <Card
                key={area.id}
                onPress={
                  canManage ? () => handleOpenAreaActions(area) : undefined
                }
                style={!area.isActive && tw`opacity-50`}
              >
                <ThemedView style={tw`gap-4`}>
                  {/* Area Name & Status */}
                  <ThemedView style={tw`flex-row items-center justify-between`}>
                    <ThemedView style={tw`gap-4 flex-1`}>
                      <Ionicons
                        name="cube-outline"
                        size={30}
                        color={tw.color("text-light-on-surface-variant")}
                      />
                      <ThemedView style={tw`flex-1 gap-2`}>
                        <ThemedText
                          type="h4"
                          style={tw`text-light-on-surface-variant`}
                        >
                          {area.name}
                        </ThemedText>
                        <ThemedView style={tw`flex-row items-center gap-2`}>
                          <Ionicons
                            name="print-outline"
                            size={16}
                            color={tw.color("text-light-on-surface-variant")}
                          />
                          <ThemedText type="small" style={tw``}>
                            {getPrinterCountText(area.printers?.length || 0)}
                          </ThemedText>
                        </ThemedView>
                      </ThemedView>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              </Card>
            ))}
          </ThemedView>
        )}
      </ScrollView>

      {canManage && <Fab icon="add" onPress={handleCreateArea} />}

      <ThemedBottomSheetModal ref={actionsSheetRef} enablePanDownToClose>
        {selectedArea && (
          <ThemedView style={tw`px-4 py-4 gap-6`}>
            <ThemedView style={tw`flex-row justify-between items-start gap-3`}>
              <ThemedView style={tw`flex-1 gap-2`}>
                <ThemedText type="h2" style={{ fontFamily: typography.medium }}>
                  {selectedArea.name}
                </ThemedText>
                <ThemedView style={tw`flex-row items-center gap-2 flex-wrap`}>
                  <ThemedView style={tw`flex-row items-center gap-1`}>
                    <Ionicons
                      name="print-outline"
                      size={16}
                      color={tw.color("text-gray-500")}
                    />
                    <ThemedText type="small" style={tw`text-gray-500`}>
                      {getPrinterCountText(selectedArea.printers?.length || 0)}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                {!!selectedArea.description && (
                  <ThemedText type="body2" style={tw`text-gray-500`}>
                    {selectedArea.description}
                  </ThemedText>
                )}
              </ThemedView>
              <IconButton
                icon={selectedArea.isActive ? "eye-outline" : "eye-off-outline"}
                variant="secondary"
                onPress={handleToggleActive}
              />
            </ThemedView>
            <ThemedView style={tw`flex-row gap-4 items-center`}>
              <Button
                label={t("delete")}
                leftIcon="trash"
                variant="destructive"
                onPress={() => {
                  handleCloseAreaActions();
                  setAreaToDelete(selectedArea);
                }}
              />
              <Button
                label={t("edit")}
                leftIcon="create"
                variant="secondary"
                style={tw`flex-1`}
                onPress={() => {
                  handleCloseAreaActions();
                  handleEditArea(selectedArea);
                }}
              />
            </ThemedView>
          </ThemedView>
        )}
      </ThemedBottomSheetModal>

      <DialogModal
        visible={!!areaToDelete}
        title={t("deleteTitle")}
        message={t("deleteMessage")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        loading={deleteProductionArea.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setAreaToDelete(null)}
      />
    </ScreenLayout>
  );
}
