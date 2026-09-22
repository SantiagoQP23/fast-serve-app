import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { toast } from "sonner-native";
import { useState } from "react";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { usePrinters } from "@/core/printers/hooks/usePrinters";
import { PrinterConnectionType } from "@/core/common/models/printer.model";
import { ThermalPrinterService } from "@/core/printers/services/thermal-printer.service";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import Select from "@/presentation/theme/components/select";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";

const CONNECTION_OPTIONS: { label: string; value: PrinterConnectionType }[] = [
  { label: "TCP", value: "TCP" },
];

const buildPrinterSchema = (t: (key: string) => string) =>
  z
    .object({
      name: z.string().min(1, t("validations.nameRequired")),
      connectionType: z.enum(["TCP"]),
      ipAddress: z.string().optional(),
      port: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.connectionType !== "TCP") return true;
        return !!data.ipAddress?.trim();
      },
      {
        message: t("validations.ipAddressRequired"),
        path: ["ipAddress"],
      },
    )
    .refine(
      (data) => {
        if (data.connectionType !== "TCP" || !data.ipAddress?.trim()) {
          return true;
        }
        return /^(\d{1,3}\.){3}\d{1,3}$/.test(data.ipAddress.trim());
      },
      {
        message: t("validations.invalidIpAddress"),
        path: ["ipAddress"],
      },
    )
    .refine(
      (data) => {
        const port = data.port ? Number(data.port) : NaN;
        return !Number.isNaN(port) && port > 0 && port <= 65535;
      },
      {
        message: t("validations.invalidPort"),
        path: ["port"],
      },
    );

type PrinterFormData = z.infer<ReturnType<typeof buildPrinterSchema>>;

export default function PrinterFormScreen() {
  const { t } = useTranslation("printers");
  const params = useLocalSearchParams<{
    printerId?: string;
    name?: string;
    connectionType?: PrinterConnectionType;
    ipAddress?: string;
    port?: string;
  }>();

  const printerId = params.printerId;
  const isEditing = !!printerId;

  const { createPrinter, updatePrinter } = usePrinters();
  const { currentRestaurant } = useAuthStore();
  const [isTestingPrinter, setIsTestingPrinter] = useState(false);

  const schema = buildPrinterSchema(t);

  const {
    control,
    handleSubmit,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<PrinterFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: params.name || "",
      connectionType: (params.connectionType as "TCP") || "TCP",
      ipAddress: params.ipAddress || "",
      port: params.port || "9100",
    },
  });

  const connectionType = watch("connectionType");

  const handleTestPrinter = async () => {
    const result = schema.safeParse(getValues());
    if (!result.success) {
      toast.error(result.error.issues[0]?.message || t("testPrintErrorMessage"));
      return;
    }

    const data = result.data;
    setIsTestingPrinter(true);
    const toastId = toast.loading(t("testPrintLoading"));
    try {
      await ThermalPrinterService.printTest(
        {
          id: printerId || "temp",
          name: data.name.trim(),
          connectionType: data.connectionType,
          ipAddress: data.ipAddress?.trim(),
          port: Number(data.port),
          isActive: true,
          createdAt: "",
          updatedAt: "",
        },
        currentRestaurant?.name,
      );
      toast.success(t("testPrintSuccessMessage"), { id: toastId });
    } catch (error: any) {
      toast.error(error?.message || t("testPrintErrorMessage"), {
        id: toastId,
      });
    } finally {
      setIsTestingPrinter(false);
    }
  };

  const onSubmit = async (data: PrinterFormData) => {
    const payload = {
      name: data.name.trim(),
      connectionType: data.connectionType,
      ipAddress:
        data.connectionType === "TCP" ? data.ipAddress?.trim() : undefined,
      port: data.port ? Number(data.port) : 9100,
    };

    if (isEditing) {
      await updatePrinter.mutateAsync({ ...payload, id: printerId! });
    } else {
      await createPrinter.mutateAsync(payload);
    }

    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1`}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`pb-8`}
        >
          {/* Header */}
          <ThemedView style={tw`items-center gap-2 flex-row justify-between`}>
            <ThemedView style={tw`items-center gap-4 flex-row`}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => tw.style(pressed && "opacity-70")}
              >
                <Ionicons name="arrow-back-outline" size={24} />
              </Pressable>
              <ThemedText type="h3" style={{ fontFamily: typography.regular }}>
                {isEditing ? t("editPrinter") : t("createPrinter")}
              </ThemedText>
            </ThemedView>
            <Button
              label={isEditing ? t("save") : t("create")}
              size="small"
              onPress={handleSubmit(onSubmit)}
              loading={
                isSubmitting || createPrinter.isPending || updatePrinter.isPending
              }
              disabled={
                isSubmitting || createPrinter.isPending || updatePrinter.isPending
              }
            />
          </ThemedView>

          <ThemedView style={tw`my-6`} />

          {/* Form */}
          <ThemedView style={tw`gap-4`}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("fields.name")}
                  icon="print-outline"
                  placeholder={t("placeholders.name")}
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={errors.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="connectionType"
              render={({ field: { onChange, value } }) => (
                <Select
                  label={t("fields.connectionType")}
                  options={CONNECTION_OPTIONS}
                  value={value}
                  onChange={(val) => onChange(val as "TCP")}
                />
              )}
            />

            {connectionType === "TCP" && (
              <Controller
                control={control}
                name="ipAddress"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label={t("fields.ipAddress")}
                    icon="globe-outline"
                    placeholder={t("placeholders.ipAddress")}
                    keyboardType="decimal-pad"
                    autoCapitalize="none"
                    onBlur={onBlur}
                    value={value}
                    onChangeText={onChange}
                    error={errors.ipAddress?.message}
                  />
                )}
              />
            )}

            <Controller
              control={control}
              name="port"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("fields.port")}
                  icon="hardware-chip-outline"
                  placeholder={t("placeholders.port")}
                  keyboardType="number-pad"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={errors.port?.message}
                />
              )}
            />

            <Button
              label={t(isTestingPrinter ? "testing" : "test")}
              leftIcon="flash-outline"
              variant="outline"
              onPress={handleTestPrinter}
              loading={isTestingPrinter}
              disabled={isTestingPrinter}
            />
          </ThemedView>

        </ScrollView>
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}
