import { useRef, useState } from "react";
import {
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { toast } from "sonner-native";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { usePrinters } from "@/core/printers/hooks/usePrinters";
import { ThermalPrinterService } from "@/core/printers/services/thermal-printer.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Roles, isValidRole } from "@/core/auth/models/user.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import IconButton from "@/presentation/theme/components/icon-button";
import DetailHeader from "@/presentation/theme/components/detail-header";
import PrinterActionsBottomSheet, {
  type PrinterActionsBottomSheetRef,
} from "@/presentation/printers/components/printer-actions-bottom-sheet";

export default function PrintersScreen() {
  const { t } = useTranslation("printers");
  const { getAll } = usePrinters();
  const { data: printers, isLoading, isError, refetch, isRefetching } = getAll;
  const { currentRestaurant, user } = useAuthStore();
  const canManage = isValidRole(user?.role?.name, [Roles.ADMIN, Roles.OWNER]);

  const [testingPrinterId, setTestingPrinterId] = useState<string | null>(null);
  const actionsSheetRef = useRef<PrinterActionsBottomSheetRef>(null);

  const handleTestPrinter = async (printerId: string) => {
    const printer = printers?.find((p) => p.id === printerId);
    if (!printer) return;

    setTestingPrinterId(printerId);
    const toastId = toast.loading(t("testPrintLoading"));
    try {
      console.log("Testing printer:", printer);
      await ThermalPrinterService.printTest(printer, currentRestaurant?.name);
      toast.success(t("testPrintSuccessMessage"), { id: toastId });
    } catch (error: any) {
      toast.error(error?.message || t("testPrintErrorMessage"), {
        id: toastId,
      });
    } finally {
      setTestingPrinterId(null);
    }
  };

  const handleCreatePrinter = () => {
    router.push("/(profile)/production/printers/form");
  };

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
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
        <DetailHeader title={t("title")} subtitle={t("subtitle")}>
          {canManage && (
            <ThemedView style={tw`flex-row flex-wrap gap-3`}>
              <Button
                label={t("newPrinter")}
                leftIcon="plus"
                shape="rounded"
                size="small"
                onPress={handleCreatePrinter}
              />
            </ThemedView>
          )}
        </DetailHeader>

        {isLoading && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="printer" size={48} color={tw.color("gray-400")} />
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

        {!isLoading && !isError && printers?.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="printer" size={48} color={tw.color("gray-400")} />
            <ThemedText type="body1" style={tw`font-semibold`}>
              {t("noPrinters")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {t("noPrintersDescription")}
            </ThemedText>
          </ThemedView>
        )}

        {!isLoading && !isError && printers && printers.length > 0 && (
          <ThemedView style={tw`gap-4`}>
            {printers.map((printer) => (
              <Card
                key={printer.id}
                onPress={
                  canManage
                    ? () => actionsSheetRef.current?.present(printer)
                    : undefined
                }
                style={!printer.isActive && tw`opacity-50`}
                variant="outline"
              >
                <ThemedView style={tw`gap-4`}>
                  {/* Printer Name & Status */}
                  <ThemedView style={tw`flex-row items-center justify-between`}>
                    <ThemedView style={tw`flex-row items-center gap-4 flex-1`}>
                      <Icon
                        name="printer"
                        size={30}
                        color={tw.color("text-on-surface-variant")}
                      />
                      <ThemedView style={tw`flex-1 gap-0.5`}>
                        <ThemedText type="h4">{printer.name}</ThemedText>
                        <ThemedText type="small" style={tw`text-gray-500`}>
                          {printer.ipAddress}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>

                    {testingPrinterId === printer.id ? (
                      <ActivityIndicator
                        size="small"
                        color={tw.color("primary")}
                        style={tw`p-3`}
                      />
                    ) : (
                      <IconButton
                        icon="zap"
                        onPress={() => handleTestPrinter(printer.id)}
                        disabled={!!testingPrinterId}
                      />
                    )}
                  </ThemedView>
                </ThemedView>
              </Card>
            ))}
          </ThemedView>
        )}
      </ScrollView>

      <PrinterActionsBottomSheet ref={actionsSheetRef} />
    </ScreenLayout>
  );
}
