import { ScrollView, RefreshControl, Alert } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { usePrinters } from "@/core/printers/hooks/usePrinters";
import { ThermalPrinterService } from "@/core/printers/services/thermal-printer.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import { useState } from "react";

export default function PrintersScreen() {
  const { t } = useTranslation("auth");
  const { getAll } = usePrinters();
  const { data: printers, isLoading, isError, refetch, isRefetching } = getAll;
  const { currentRestaurant } = useAuthStore();
  const [testingPrinterId, setTestingPrinterId] = useState<string | null>(null);

  const handleTestPrinter = async (printerId: string) => {
    const printer = printers?.find((p) => p.id === printerId);
    if (!printer) return;

    setTestingPrinterId(printerId);
    try {
      console.log("Testing printer:", printer);
      await ThermalPrinterService.printTest(printer, currentRestaurant?.name);
      Alert.alert(
        t("printers:testPrintSuccessTitle"),
        t("printers:testPrintSuccessMessage"),
      );
    } catch (error: any) {
      Alert.alert(
        t("printers:testPrintErrorTitle"),
        error?.message || t("printers:testPrintErrorMessage"),
      );
    } finally {
      setTestingPrinterId(null);
    }
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
        {/* Header */}
        <ThemedView style={tw`flex-row items-center gap-2 justify-center py-4`}>
          <Ionicons name="print-outline" size={24} />
          <ThemedText type="h2">{t("profile.printers")}</ThemedText>
        </ThemedView>

        {isLoading && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="print-outline" size={48} color="#999" />
            <ThemedText type="body1" style={tw`text-gray-500`}>
              Loading printers...
            </ThemedText>
          </ThemedView>
        )}

        {isError && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <ThemedText type="body1" style={tw`text-red-500`}>
              Failed to load printers
            </ThemedText>
            <Button label="Retry" onPress={() => refetch()} variant="outline" />
          </ThemedView>
        )}

        {!isLoading && !isError && printers?.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="print-outline" size={48} color="#999" />
            <ThemedText type="body1" style={tw`font-semibold`}>
              No printers found
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              There are no printers configured for this restaurant.
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
                    <ThemedView style={tw`flex-row items-center gap-3 flex-1`}>
                      <Ionicons
                        name="print-outline"
                        size={24}
                        color={
                          printer.isActive
                            ? tw.color("green-500")
                            : tw.color("gray-400")
                        }
                      />
                      <ThemedView style={tw`flex-1`}>
                        <ThemedText type="h4" style={tw`font-semibold`}>
                          {printer.name}
                        </ThemedText>
                        <ThemedText
                          type="small"
                          style={tw`${
                            printer.isActive
                              ? "text-green-500"
                              : "text-gray-400"
                          }`}
                        >
                          {printer.isActive ? "Active" : "Inactive"}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                  </ThemedView>

                  {/* Divider */}
                  <ThemedView style={tw`h-px bg-gray-200 dark:bg-gray-700`} />

                  {/* Printer Details */}
                  <ThemedView style={tw`gap-2`}>
                    <ThemedView style={tw`flex-row items-center gap-2`}>
                      <Ionicons name="wifi-outline" size={16} color="#999" />
                      <ThemedText type="body2" style={tw`text-gray-500`}>
                        Connection: {printer.connectionType}
                      </ThemedText>
                    </ThemedView>

                    {printer.ipAddress && (
                      <ThemedView style={tw`flex-row items-center gap-2`}>
                        <Ionicons name="globe-outline" size={16} color="#999" />
                        <ThemedText type="body2" style={tw`text-gray-500`}>
                          IP: {printer.ipAddress}
                        </ThemedText>
                      </ThemedView>
                    )}

                    <ThemedView style={tw`flex-row items-center gap-2`}>
                      <Ionicons
                        name="hardware-chip-outline"
                        size={16}
                        color="#999"
                      />
                      <ThemedText type="body2" style={tw`text-gray-500`}>
                        Port: {printer.port}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>

                  {/* Test Button */}
                  <Button
                    label={
                      testingPrinterId === printer.id ? "Testing..." : "Test"
                    }
                    leftIcon="send-outline"
                    variant="outline"
                    size="small"
                    onPress={() => handleTestPrinter(printer.id)}
                    disabled={testingPrinterId !== null}
                    loading={testingPrinterId === printer.id}
                  />
                </ThemedView>
              </Card>
            ))}
          </ThemedView>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}
