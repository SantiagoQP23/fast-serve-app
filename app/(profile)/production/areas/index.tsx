import { useMemo, useRef } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { router } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
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
import Chip from "@/presentation/theme/components/chip";
import Fab from "@/presentation/theme/components/fab";
import type { ProductionArea } from "@/core/menu/models/producion-area.model";
import AreaPrintersBottomSheet, {
  type AreaPrintersBottomSheetRef,
} from "@/presentation/production-areas/components/area-printers-bottom-sheet";
import PrinterActionsBottomSheet, {
  type PrinterActionsBottomSheetRef,
} from "@/presentation/printers/components/printer-actions-bottom-sheet";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";

export default function ProductionAreasScreen() {
  const { t } = useTranslation("productionAreas");
  const { getAllQuery, productionAreas } = useProductionAreas();
  const { isLoading, isError, refetch, isRefetching } = getAllQuery;
  const { user } = useAuthStore();
  const canManage = isValidRole(user?.role?.name, [Roles.ADMIN, Roles.OWNER]);
  const { products } = useMenu();

  const productCountByArea = useMemo(() => {
    const counts = new Map<number, number>();
    for (const product of products) {
      const id = product.productionArea?.id;
      if (id != null) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  const printersSheetRef = useRef<AreaPrintersBottomSheetRef>(null);
  const printerActionsSheetRef = useRef<PrinterActionsBottomSheetRef>(null);

  const handleCreateArea = () => {
    router.push("/(profile)/production/areas/form");
  };

  const handleOpenArea = (area: ProductionArea) => {
    router.push({
      pathname: "/(profile)/production/areas/detail",
      params: { areaId: String(area.id) },
    });
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
            tintColor={tw.color("primary")}
            colors={[tw.color("primary") as string]}
          />
        }
      >
        {isLoading && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="package" size={48} color={tw.color("gray-400")} />
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {t("loading")}
            </ThemedText>
          </ThemedView>
        )}

        {isError && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="circle-alert" size={48} color={tw.color("red-500")} />
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
            <Icon name="package" size={48} color={tw.color("gray-400")} />
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
                onPress={() => handleOpenArea(area)}
                style={!area.isActive && tw`opacity-50`}
                variant="outline"
              >
                <ThemedView style={tw`gap-4`}>
                  {/* Area Name & Status */}
                  <ThemedView style={tw`flex-row items-center justify-between`}>
                    <ThemedView style={tw`gap-4 flex-1`}>
                      <Icon
                        name="package"
                        size={30}
                        color={tw.color("text-primary")}
                      />
                      <ThemedView style={tw`flex-1 gap-4`}>
                        <ThemedView style={tw`gap-0.5`}>
                          <ThemedText type="h4" style={tw`text-on-surface`}>
                            {area.name}
                          </ThemedText>
                          <ThemedText type="small" style={tw`text-gray-500`}>
                            {t("productCount", {
                              count: productCountByArea.get(area.id) ?? 0,
                            })}
                          </ThemedText>
                        </ThemedView>
                        {area.printers?.length ? (
                          <ThemedView style={tw`flex-row flex-wrap gap-2`}>
                            {area.printers.map((printer) => (
                              <Chip
                                key={printer.id}
                                variant="assist"
                                icon="printer"
                                label={printer.name}
                                onPress={
                                  canManage
                                    ? () =>
                                        printerActionsSheetRef.current?.present(
                                          printer,
                                        )
                                    : undefined
                                }
                              />
                            ))}
                          </ThemedView>
                        ) : canManage ? (
                          <Button
                            label={t("setUpPrinter")}
                            leftIcon="printer"
                            variant="text"
                            size="extra-small"
                            style={tw`self-start -ml-3`}
                            onPress={() =>
                              printersSheetRef.current?.present(area)
                            }
                          />
                        ) : (
                          <ThemedView style={tw`flex-row items-center gap-2`}>
                            <Icon
                              name="printer"
                              size={16}
                              color={tw.color("text-on-surface-variant")}
                            />
                            <ThemedText type="small" style={tw``}>
                              {getPrinterCountText(area.printers?.length || 0)}
                            </ThemedText>
                          </ThemedView>
                        )}
                      </ThemedView>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              </Card>
            ))}
          </ThemedView>
        )}

        {!isLoading && !isError && (
          <Button
            label={t("managePrinters")}
            leftIcon="printer"
            variant="outline"
            onPress={() => router.push("/(profile)/production/printers")}
          />
        )}
      </ScrollView>

      {canManage && <Fab icon="plus" onPress={handleCreateArea} />}

      <AreaPrintersBottomSheet ref={printersSheetRef} />
      <PrinterActionsBottomSheet ref={printerActionsSheetRef} />
    </ScreenLayout>
  );
}
