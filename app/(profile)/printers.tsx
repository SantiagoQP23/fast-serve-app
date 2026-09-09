import { useState } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { router } from "expo-router";
import { toast } from "sonner-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { usePrinters } from "@/core/printers/hooks/usePrinters";
import { ThermalPrinterService } from "@/core/printers/services/thermal-printer.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Fab from "@/presentation/theme/components/fab";
import IconButton from "@/presentation/theme/components/icon-button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import type { Printer } from "@/core/common/models/printer.model";

export default function PrintersScreen() {
  const { t } = useTranslation("printers");
  const { getAll, deletePrinter } = usePrinters();
  const { data: printers, isLoading, isError, refetch, isRefetching } = getAll;
  const { currentRestaurant } = useAuthStore();

  const [testingPrinterId, setTestingPrinterId] = useState<string | null>(null);
  const [printerToDelete, setPrinterToDelete] = useState<Printer | null>(null);

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
    router.push("/(profile)/printer-form");
  };

  const handleEditPrinter = (printer: Printer) => {
    router.push({
      pathname: "/(profile)/printer-form",
      params: {
        printerId: printer.id,
        name: printer.name,
        connectionType: printer.connectionType,
        ipAddress: printer.ipAddress || "",
        port: String(printer.port),
        isActive: String(printer.isActive),
      },
    });
  };

  const handleConfirmDelete = async () => {
    if (!printerToDelete) return;
    await deletePrinter.mutateAsync(printerToDelete.id);
    setPrinterToDelete(null);
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
            <Ionicons name="print-outline" size={48} color="#999" />
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

        {!isLoading && !isError && printers?.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="print-outline" size={48} color="#999" />
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
              <Card key={printer.id}>
                <ThemedView style={tw`gap-4`}>
                  {/* Printer Name & Status */}
                  <ThemedView style={tw`flex-row items-center justify-between`}>
                    <ThemedView style={tw`flex-row  items-center gap-4 flex-1`}>
                      <Ionicons
                        name="print-outline"
                        size={30}
                        color={tw.color("text-light-on-surface-variant")}
                      />
                      <ThemedView
                        style={tw`flex-1 text-light-on-surface-variant gap-2`}
                      >
                        <ThemedText type="h4" style={tw`font-semibold`}>
                          {printer.name}
                        </ThemedText>
                        <ThemedText type="small">
                          {printer.ipAddress}
                        </ThemedText>
                        {/* <ThemedText type="small"> */}
                        {/*   {printer.isActive ? t("active") : t("inactive")} */}
                        {/* </ThemedText> */}
                      </ThemedView>
                    </ThemedView>
                  </ThemedView>

                  {/* Divider */}
                  {/* <ThemedView style={tw`h-px bg-gray-200 dark:bg-gray-700`} /> */}

                  {/* Printer Details */}
                  {/* <ThemedView style={tw`gap-2`}> */}
                  {/*   <ThemedView style={tw`flex-row items-center gap-2`}> */}
                  {/*     <Ionicons name="wifi-outline" size={16} color="#999" /> */}
                  {/*     <ThemedText type="body2" style={tw`text-gray-500`}> */}
                  {/*       {t("fields.connectionType")}: {printer.connectionType} */}
                  {/*     </ThemedText> */}
                  {/*   </ThemedView> */}
                  {/**/}
                  {/*   {printer.ipAddress && ( */}
                  {/*     <ThemedView style={tw`flex-row items-center gap-2`}> */}
                  {/*       <Ionicons name="globe-outline" size={16} color="#999" /> */}
                  {/*       <ThemedText type="body2" style={tw`text-gray-500`}> */}
                  {/*         {t("fields.ipAddress")}: {printer.ipAddress} */}
                  {/*       </ThemedText> */}
                  {/*     </ThemedView> */}
                  {/*   )} */}
                  {/**/}
                  {/*   <ThemedView style={tw`flex-row items-center gap-2`}> */}
                  {/*     <Ionicons */}
                  {/*       name="hardware-chip-outline" */}
                  {/*       size={16} */}
                  {/*       color="#999" */}
                  {/*     /> */}
                  {/*     <ThemedText type="body2" style={tw`text-gray-500`}> */}
                  {/*       {t("fields.port")}: {printer.port} */}
                  {/*     </ThemedText> */}
                  {/*   </ThemedView> */}
                  {/* </ThemedView> */}

                  {/* Test Button */}

                  {/* <ThemedView style={tw`flex-row items-center gap-4`}> */}
                  {/* <IconButton */}
                  {/*   icon="trash-outline" */}
                  {/*   size={20} */}
                  {/*   color="danger" */}
                  {/*   onPress={() => setPrinterToDelete(printer)} */}
                  {/* /> */}
                  {/* <IconButton */}
                  {/*   icon="create-outline" */}
                  {/*   size={20} */}
                  {/*   color="primary" */}
                  {/*   onPress={() => handleEditPrinter(printer)} */}
                  {/* /> */}
                  {/* <ThemedView style={tw`flex-1`} /> */}
                  {/* <Button */}
                  {/*   label={ */}
                  {/*     testingPrinterId === printer.id */}
                  {/*       ? t("testing") */}
                  {/*       : t("test") */}
                  {/*   } */}
                  {/*   leftIcon="send-outline" */}
                  {/*   variant="secondary" */}
                  {/*   size="small" */}
                  {/*   onPress={() => handleTestPrinter(printer.id)} */}
                  {/*   disabled={testingPrinterId !== null} */}
                  {/*   loading={testingPrinterId === printer.id} */}
                  {/* /> */}
                  {/* </ThemedView> */}
                </ThemedView>
              </Card>
            ))}
          </ThemedView>
        )}
      </ScrollView>

      <Fab icon="add" onPress={handleCreatePrinter} />

      <DialogModal
        visible={!!printerToDelete}
        title={t("deleteTitle")}
        message={t("deleteMessage")}
        confirmText={t("confirm")}
        cancelText={t("cancel")}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPrinterToDelete(null)}
      />
    </ScreenLayout>
  );
}
