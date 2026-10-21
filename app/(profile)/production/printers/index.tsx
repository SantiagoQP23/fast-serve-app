import { useRef, useState } from "react";
import { ScrollView, RefreshControl, ActivityIndicator } from "react-native";
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
import Fab from "@/presentation/theme/components/fab";
import IconButton from "@/presentation/theme/components/icon-button";
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
                    <ThemedView style={tw`flex-row  items-center gap-4 flex-1`}>
                      <Icon
                        name="printer"
                        size={30}
                        color={tw.color("text-on-surface-variant")}
                      />
                      <ThemedView
                        style={tw`flex-1 text-on-surface-variant gap-2`}
                      >
                        <ThemedText type="h4" style={tw`font-semibold`}>
                          {printer.name}
                        </ThemedText>
                        <ThemedText type="small">
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

      {canManage && <Fab icon="plus" onPress={handleCreatePrinter} />}

      <PrinterActionsBottomSheet ref={actionsSheetRef} />
    </ScreenLayout>
  );
}
