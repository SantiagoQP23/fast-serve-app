import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { router } from "expo-router";
import { type BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import type { Printer } from "@/core/common/models/printer.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { usePrinters } from "@/core/printers/hooks/usePrinters";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import Icon from "@/presentation/theme/components/icon";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { typography } from "@/constants/theme";

export type PrinterActionsBottomSheetRef = {
  present: (printer: Printer) => void;
  dismiss: () => void;
};

/**
 * Printer options (edit, delete). Shared by the printers screen
 * and the production areas screen's printer chips.
 */
const PrinterActionsBottomSheet = forwardRef<PrinterActionsBottomSheetRef>(
  (_, ref) => {
    const { t } = useTranslation("printers");
    const { getAll, deletePrinter } = usePrinters();

    const sheetRef = useRef<BottomSheetMethods>(null);
    const [presented, setPresented] = useState<Printer | null>(null);
    const [printerToDelete, setPrinterToDelete] = useState<Printer | null>(
      null,
    );

    // Prefer the fresh copy from the printers list — area chips carry a
    // snapshot that can lag behind edits.
    const printer =
      getAll.data.find((p) => p.id === presented?.id) ?? presented;

    useImperativeHandle(ref, () => ({
      present: (next) => {
        setPresented(next);
        sheetRef.current?.present();
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const handleDismiss = () => sheetRef.current?.dismiss();

    const handleEdit = (target: Printer) => {
      handleDismiss();
      router.push({
        pathname: "/(profile)/production/printers/form",
        params: {
          printerId: target.id,
          name: target.name,
          connectionType: target.connectionType,
          ipAddress: target.ipAddress || "",
          port: String(target.port),
          isActive: String(target.isActive),
        },
      });
    };

    const handleConfirmDelete = async () => {
      if (!printerToDelete) return;
      await deletePrinter.mutateAsync(printerToDelete.id);
      setPrinterToDelete(null);
    };

    return (
      <>
        <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
          {printer && (
            <ThemedView style={tw`px-4 py-4 gap-6`}>
              <ThemedView style={tw`gap-2`}>
                <ThemedText type="h2" style={{ fontFamily: typography.medium }}>
                  {printer.name}
                </ThemedText>
                <ThemedView style={tw`flex-row items-center gap-2 flex-wrap`}>
                  <ThemedView style={tw`flex-row items-center gap-1`}>
                    <Icon
                      name="cpu"
                      size={16}
                      color={tw.color("text-gray-500")}
                    />
                    <ThemedText type="small" style={tw`text-gray-500`}>
                      {printer.connectionType === "TCP" && printer.ipAddress
                        ? `${printer.ipAddress}:${printer.port}`
                        : t(`connectionTypes.${printer.connectionType}`)}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
              <ThemedView style={tw` gap-4 mt-8 `}>
                <Button
                  label={t("edit")}
                  leftIcon="square-pen"
                  variant="outline"
                  size="small"
                  onPress={() => handleEdit(printer)}
                />
                <Button
                  leftIcon="trash"
                  label={t("delete")}
                  variant="text"
                  size="small"
                  onPress={() => {
                    handleDismiss();
                    setPrinterToDelete(printer);
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
      </>
    );
  },
);

PrinterActionsBottomSheet.displayName = "PrinterActionsBottomSheet";

export default PrinterActionsBottomSheet;
