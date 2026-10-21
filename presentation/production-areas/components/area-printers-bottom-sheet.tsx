import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Pressable } from "react-native";
import { router } from "expo-router";
import { toast } from "sonner-native";
import {
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import type { ProductionArea } from "@/core/menu/models/producion-area.model";
import type { Printer } from "@/core/common/models/printer.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { usePrinters } from "@/core/printers/hooks/usePrinters";
import { useProductionAreas } from "@/presentation/production-areas/hooks/useProductionAreas";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Checkbox from "@/presentation/theme/components/checkbox";
import Button from "@/presentation/theme/components/button";
import Icon from "@/presentation/theme/components/icon";

export type AreaPrintersBottomSheetRef = {
  /** Opens the sheet with the area's current printers checked. */
  present: (area: ProductionArea) => void;
  dismiss: () => void;
};

/**
 * Picks which printers a production area prints to and saves them right
 * away, without going through the area form.
 */
const AreaPrintersBottomSheet = forwardRef<AreaPrintersBottomSheetRef>(
  (_, ref) => {
    const { t } = useTranslation(["productionAreas", "printers"]);
    const { getAll: printersQuery } = usePrinters();
    const { updateProductionArea } = useProductionAreas();
    const printers = printersQuery.data ?? [];

    const sheetRef = useRef<BottomSheetMethods>(null);
    const [area, setArea] = useState<ProductionArea | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());

    useImperativeHandle(ref, () => ({
      present: (nextArea) => {
        setArea(nextArea);
        setSelected(new Set(nextArea.printers?.map((p) => p.id) ?? []));
        sheetRef.current?.present();
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const toggle = (id: string, value: boolean) => {
      setSelected((current) => {
        const next = new Set(current);
        if (value) next.add(id);
        else next.delete(id);
        return next;
      });
    };

    const handleAddPrinter = () => {
      sheetRef.current?.dismiss();
      router.push("/(profile)/production/printers/form");
    };

    const handleSave = async () => {
      if (!area) return;
      try {
        await updateProductionArea.mutateAsync({
          id: area.id,
          name: area.name,
          description: area.description,
          isActive: area.isActive,
          printerIds: [...selected],
        });
        toast.success(t("productionAreas:updateSuccess"));
        sheetRef.current?.dismiss();
      } catch {
        // The mutation already shows the error toast; keep the sheet open.
      }
    };

    const printerDetail = (printer: Printer) =>
      printer.connectionType === "TCP" && printer.ipAddress
        ? `${printer.ipAddress}:${printer.port}`
        : t(`printers:connectionTypes.${printer.connectionType}`);

    return (
      // Sized to its content with the list capped below, so the list scrolls
      // to its end and the button stays visible.
      <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6 gap-4`}>
          <ThemedView style={tw`gap-1 px-2`}>
            <ThemedText type="h3">
              {t("productionAreas:printersSheet.title")}
            </ThemedText>
            {!!area && (
              <ThemedText type="body2" style={tw`text-gray-500`}>
                {t("productionAreas:printersSheet.subtitle", {
                  area: area.name,
                })}
              </ThemedText>
            )}
          </ThemedView>

          {!printersQuery.isLoading && printers.length === 0 ? (
            <ThemedView style={tw`items-center py-6 gap-2 px-4`}>
              <Icon name="printer" size={32} color={tw.color("gray-400")} />
              <ThemedText type="body2" style={tw`font-semibold`}>
                {t("productionAreas:noPrintersAvailable")}
              </ThemedText>
              <ThemedText type="small" style={tw`text-center text-gray-500`}>
                {t("productionAreas:noPrintersDescription")}
              </ThemedText>
              <Button
                label={t("productionAreas:printersSheet.addPrinter")}
                leftIcon="plus"
                variant="outline"
                size="small"
                style={tw`mt-2`}
                onPress={handleAddPrinter}
              />
            </ThemedView>
          ) : (
            <>
              <ThemedView style={tw`max-h-[50vh]`}>
                <BottomSheetScrollView
                  contentContainerStyle={tw`gap-2`}
                  showsVerticalScrollIndicator={false}
                >
                  {printers.map((printer) => (
                    <Pressable
                      key={printer.id}
                      onPress={() =>
                        toggle(printer.id, !selected.has(printer.id))
                      }
                      style={({ pressed }) => [
                        tw`p-4 rounded-2xl bg-surface-container-low flex-row items-center gap-3`,
                        !printer.isActive && tw`opacity-50`,
                        pressed && tw`opacity-80`,
                      ]}
                    >
                      <Icon
                        name="printer"
                        size={22}
                        color={tw.color("on-surface-variant")}
                      />
                      <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
                        <ThemedText type="body1" numberOfLines={1}>
                          {printer.name}
                        </ThemedText>
                        <ThemedText type="small" style={tw`text-gray-500`}>
                          {printerDetail(printer)}
                        </ThemedText>
                      </ThemedView>
                      <Checkbox
                        value={selected.has(printer.id)}
                        onValueChange={(value) => toggle(printer.id, value)}
                      />
                    </Pressable>
                  ))}
                  <Pressable
                    onPress={handleAddPrinter}
                    style={({ pressed }) => [
                      tw`p-4 rounded-2xl border border-dashed border-border flex-row items-center gap-3`,
                      pressed && tw`opacity-80`,
                    ]}
                  >
                    <Icon name="plus" size={22} color={tw.color("primary")} />
                    <ThemedText type="body1" style={tw`flex-1 text-primary`}>
                      {t("productionAreas:printersSheet.addPrinter")}
                    </ThemedText>
                  </Pressable>
                </BottomSheetScrollView>
              </ThemedView>

              <Button
                label={t("productionAreas:save")}
                loading={updateProductionArea.isPending}
                disabled={printersQuery.isLoading}
                onPress={handleSave}
              />
            </>
          )}
        </BottomSheetView>
      </ThemedBottomSheetModal>
    );
  },
);

AreaPrintersBottomSheet.displayName = "AreaPrintersBottomSheet";

export default AreaPrintersBottomSheet;
