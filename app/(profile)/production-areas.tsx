import { useState } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useProductionAreas } from "@/presentation/production-areas/hooks/useProductionAreas";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Fab from "@/presentation/theme/components/fab";
import IconButton from "@/presentation/theme/components/icon-button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import type { ProductionArea } from "@/core/menu/models/producion-area.model";

export default function ProductionAreasScreen() {
  const { t } = useTranslation("productionAreas");
  const { getAllQuery, productionAreas, deleteProductionArea } =
    useProductionAreas();
  const { isLoading, isError, refetch, isRefetching } = getAllQuery;

  const [areaToDelete, setAreaToDelete] = useState<ProductionArea | null>(null);

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
              <Card key={area.id}>
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

                    {/* <ThemedView style={tw`flex-row items-center`}> */}
                    {/*   <IconButton */}
                    {/*     icon="create-outline" */}
                    {/*     size={20} */}
                    {/*     color="primary" */}
                    {/*     onPress={() => handleEditArea(area)} */}
                    {/*   /> */}
                    {/*   <IconButton */}
                    {/*     icon="trash-outline" */}
                    {/*     size={20} */}
                    {/*     color="danger" */}
                    {/*     onPress={() => setAreaToDelete(area)} */}
                    {/*   /> */}
                    {/* </ThemedView> */}
                  </ThemedView>
                </ThemedView>
              </Card>
            ))}
          </ThemedView>
        )}
      </ScrollView>

      <Fab icon="add" onPress={handleCreateArea} />

      <DialogModal
        visible={!!areaToDelete}
        title={t("deleteTitle")}
        message={t("deleteMessage")}
        confirmText={t("confirm")}
        cancelText={t("cancel")}
        onConfirm={handleConfirmDelete}
        onCancel={() => setAreaToDelete(null)}
      />
    </ScreenLayout>
  );
}
