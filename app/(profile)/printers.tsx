import { useRef, useState } from "react";
import { ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { toast } from "sonner-native";
import { Ionicons } from "@expo/vector-icons";
import { type BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
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
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import IconButton from "@/presentation/theme/components/icon-button";
import type { Printer } from "@/core/common/models/printer.model";
import { typography } from "@/constants/theme";

export default function PrintersScreen() {
  const { t } = useTranslation("printers");
  const { getAll, updatePrinter, deletePrinter } = usePrinters();
  const { data: printers, isLoading, isError, refetch, isRefetching } = getAll;
  const { currentRestaurant, user } = useAuthStore();
  const canManage = isValidRole(user?.role?.name, [Roles.ADMIN, Roles.OWNER]);

  const [testingPrinterId, setTestingPrinterId] = useState<string | null>(null);
  const [printerToDelete, setPrinterToDelete] = useState<Printer | null>(null);
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(
    null,
  );
  const actionsSheetRef = useRef<BottomSheetMethods>(null);

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

  const handleOpenPrinterActions = (printer: Printer) => {
    setSelectedPrinter(printer);
    actionsSheetRef.current?.present();
  };

  const handleClosePrinterActions = () => {
    actionsSheetRef.current?.dismiss();
  };

  const handleToggleActive = () => {
    if (!selectedPrinter) return;
    updatePrinter.mutate({
      id: selectedPrinter.id,
      name: selectedPrinter.name,
      connectionType: selectedPrinter.connectionType,
      ipAddress: selectedPrinter.ipAddress,
      port: selectedPrinter.port,
      isActive: !selectedPrinter.isActive,
    });
    handleClosePrinterActions();
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
              <Card
                key={printer.id}
                onPress={
                  canManage
                    ? () => handleOpenPrinterActions(printer)
                    : undefined
                }
                style={!printer.isActive && tw`opacity-50`}
              >
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
                      </ThemedView>
                    </ThemedView>

                    {testingPrinterId === printer.id ? (
                      <ActivityIndicator
                        size="small"
                        color={tw.color("blue-500")}
                        style={tw`p-3`}
                      />
                    ) : (
                      <IconButton
                        icon="flash-outline"
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

      {canManage && <Fab icon="add" onPress={handleCreatePrinter} />}

      <ThemedBottomSheetModal ref={actionsSheetRef} enablePanDownToClose>
        {selectedPrinter && (
          <ThemedView style={tw`px-4 py-4 gap-6`}>
            <ThemedView style={tw`flex-row justify-between items-start gap-3`}>
              <ThemedView style={tw`flex-1 gap-2`}>
                <ThemedText type="h2" style={{ fontFamily: typography.medium }}>
                  {selectedPrinter.name}
                </ThemedText>
                <ThemedView style={tw`flex-row items-center gap-2 flex-wrap`}>
                  <ThemedView style={tw`flex-row items-center gap-1`}>
                    <Ionicons
                      name="hardware-chip-outline"
                      size={16}
                      color={tw.color("text-gray-500")}
                    />
                    <ThemedText type="small" style={tw`text-gray-500`}>
                      {selectedPrinter.connectionType === "TCP" &&
                      selectedPrinter.ipAddress
                        ? `${selectedPrinter.ipAddress}:${selectedPrinter.port}`
                        : t(
                            `connectionTypes.${selectedPrinter.connectionType}`,
                          )}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
              <IconButton
                icon={
                  selectedPrinter.isActive ? "eye-outline" : "eye-off-outline"
                }
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
                  handleClosePrinterActions();
                  setPrinterToDelete(selectedPrinter);
                }}
              />
              <Button
                label={t("edit")}
                leftIcon="create"
                variant="secondary"
                style={tw`flex-1`}
                onPress={() => {
                  handleClosePrinterActions();
                  handleEditPrinter(selectedPrinter);
                }}
              />
            </ThemedView>
          </ThemedView>
        )}
      </ThemedBottomSheetModal>

      <DialogModal
        visible={!!printerToDelete}
        title={t("deleteTitle")}
        message={t("deleteMessage")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        loading={deletePrinter.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPrinterToDelete(null)}
      />
    </ScreenLayout>
  );
}
