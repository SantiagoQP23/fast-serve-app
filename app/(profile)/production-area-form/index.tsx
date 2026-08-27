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
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useProductionAreas } from "@/presentation/production-areas/hooks/useProductionAreas";
import { usePrinters } from "@/core/printers/hooks/usePrinters";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import Checkbox from "@/presentation/theme/components/checkbox";
import tw from "@/presentation/theme/lib/tailwind";

const buildProductionAreaSchema = (t: (key: string) => string) =>
  z.object({
    name: z
      .string()
      .min(3, t("validations.nameMinLength"))
      .max(60, t("validations.nameMaxLength")),
    description: z.string().optional(),
    printerIds: z.array(z.string()),
  });

type ProductionAreaFormData = z.infer<
  ReturnType<typeof buildProductionAreaSchema>
>;

export default function ProductionAreaFormScreen() {
  const { t } = useTranslation("productionAreas");
  const params = useLocalSearchParams<{
    areaId?: string;
    name?: string;
    description?: string;
    printerIds?: string;
  }>();

  const areaId = params.areaId ? Number(params.areaId) : undefined;
  const isEditing = !!areaId;

  const { createProductionArea, updateProductionArea } = useProductionAreas();
  const { getAll: printersQuery } = usePrinters();
  const printers = printersQuery.data ?? [];

  const schema = buildProductionAreaSchema(t);

  const initialPrinterIds = params.printerIds
    ? params.printerIds.split(",").filter(Boolean)
    : [];

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductionAreaFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: params.name || "",
      description: params.description || "",
      printerIds: initialPrinterIds,
    },
  });

  const onSubmit = async (data: ProductionAreaFormData) => {
    const payload = {
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      printerIds: data.printerIds,
    };

    if (isEditing) {
      await updateProductionArea.mutateAsync({
        ...payload,
        id: areaId!,
      });
    } else {
      await createProductionArea.mutateAsync(payload);
    }

    router.back();
  };

  const togglePrinterId = (
    currentIds: string[],
    printerId: string,
    onChange: (value: string[]) => void,
  ) => {
    const nextIds = currentIds.includes(printerId)
      ? currentIds.filter((id) => id !== printerId)
      : [...currentIds, printerId];
    onChange(nextIds);
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
          <ThemedView style={tw`items-center gap-2 flex-row`}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => tw.style(pressed && "opacity-70")}
            >
              <Ionicons name="arrow-back-outline" size={24} />
            </Pressable>
            <ThemedText type="h2">
              {isEditing ? t("editArea") : t("createArea")}
            </ThemedText>
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
                  icon="cube-outline"
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
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("fields.description")}
                  icon="document-text-outline"
                  placeholder={t("placeholders.description")}
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  error={errors.description?.message}
                />
              )}
            />

            {/* Printers */}
            <ThemedView style={tw`gap-3 mt-2`}>
              <ThemedText type="body1" style={tw`font-semibold`}>
                {t("fields.printers")}
              </ThemedText>

              {printersQuery.isLoading && (
                <ThemedText type="body2" style={tw`text-gray-500`}>
                  {t("loading")}
                </ThemedText>
              )}

              {!printersQuery.isLoading && printers.length === 0 && (
                <ThemedView
                  style={tw`items-center py-6 gap-2 bg-gray-50 dark:bg-gray-800 rounded-3xl px-4`}
                >
                  <Ionicons
                    name="print-outline"
                    size={32}
                    color={tw.color("gray-400")}
                  />
                  <ThemedText type="body2" style={tw`font-semibold`}>
                    {t("noPrintersAvailable")}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={tw`text-center text-gray-500`}
                  >
                    {t("noPrintersDescription")}
                  </ThemedText>
                </ThemedView>
              )}

              {!printersQuery.isLoading && printers.length > 0 && (
                <Controller
                  control={control}
                  name="printerIds"
                  render={({ field: { value, onChange } }) => (
                    <ThemedView style={tw`gap-3`}>
                      {printers.map((printer) => (
                        <Checkbox
                          key={printer.id}
                          label={printer.name}
                          value={value.includes(printer.id)}
                          onValueChange={() =>
                            togglePrinterId(value, printer.id, onChange)
                          }
                        />
                      ))}
                    </ThemedView>
                  )}
                />
              )}
            </ThemedView>
          </ThemedView>

          <ThemedView style={tw`my-6`} />

          <Button
            label={isEditing ? t("saveArea") : t("createArea")}
            onPress={handleSubmit(onSubmit)}
            loading={
              isSubmitting ||
              createProductionArea.isPending ||
              updateProductionArea.isPending
            }
            disabled={
              isSubmitting ||
              createProductionArea.isPending ||
              updateProductionArea.isPending
            }
          />
        </ScrollView>
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}
