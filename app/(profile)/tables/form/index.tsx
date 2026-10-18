import { useState } from "react";
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
import Icon from "@/presentation/theme/components/icon";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useTablesManagement } from "@/presentation/tables/hooks/useTablesManagement";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import Select from "@/presentation/theme/components/select";
import { useTablesStore } from "@/presentation/tables/hooks/useTablesStore";
import { sortAreas } from "@/presentation/tables/hooks/useTableGroups";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";

const buildTableSchema = (t: (key: string) => string) =>
  z.object({
    name: z
      .string()
      .min(1, t("settings.validations.nameRequired"))
      .max(60, t("settings.validations.nameMaxLength")),
    description: z.string().optional(),
    chairs: z
      .string()
      .min(1, t("settings.validations.chairsRequired"))
      .refine(
        (v) => Number.isInteger(Number(v)) && Number(v) > 0,
        t("settings.validations.chairsInvalid"),
      ),
    isAvailable: z.boolean(),
    areaId: z.string(),
  });

type TableFormData = z.infer<ReturnType<typeof buildTableSchema>>;

export default function TableSettingsFormScreen() {
  const { t } = useTranslation("tables");
  const params = useLocalSearchParams<{
    tableId?: string;
    name?: string;
    description?: string;
    chairs?: string;
    isAvailable?: string;
    areaId?: string;
  }>();

  const isEditing = !!params.tableId;

  const { createTable, updateTable, deleteTable } = useTablesManagement();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const areas = useTablesStore((state) => state.areas);
  const areaOptions = [
    { label: t("areas.noArea"), value: "" },
    ...sortAreas(areas).map((area) => ({ label: area.name, value: area.id })),
  ];

  const schema = buildTableSchema(t);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TableFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: params.name || "",
      description: params.description || "",
      chairs: params.chairs || "4",
      isAvailable: params.isAvailable !== "false",
      areaId: params.areaId || "",
    },
  });

  const onSubmit = async (data: TableFormData) => {
    if (isEditing) {
      await updateTable.mutateAsync({
        id: params.tableId!,
        name: data.name.trim(),
        description: data.description?.trim() || "",
        chairs: Number(data.chairs),
        areaId: data.areaId || null,
      });
    } else {
      await createTable.mutateAsync({
        name: data.name.trim(),
        description: data.description?.trim() || "",
        chairs: Number(data.chairs),
        areaId: data.areaId || null,
      });
    }

    router.back();
  };

  const handleConfirmDelete = async () => {
    if (!params.tableId) return;
    await deleteTable.mutateAsync(params.tableId);
    setShowDeleteConfirm(false);
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
          <ThemedView style={tw`items-center gap-2 flex-row justify-between`}>
            <ThemedView style={tw`items-center gap-4 flex-row`}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => tw.style(pressed && "opacity-70")}
              >
                <Icon name="arrow-left" color={tw.color("on-surface")} size={24} />
              </Pressable>
              <ThemedText type="h3" style={{ fontFamily: typography.regular }}>
                {isEditing
                  ? t("settings.editTable")
                  : t("settings.createTable")}
              </ThemedText>
            </ThemedView>
            <Button
              label={isEditing ? t("settings.save") : t("settings.create")}
              size="small"
              onPress={handleSubmit(onSubmit)}
              loading={
                isSubmitting || createTable.isPending || updateTable.isPending
              }
              disabled={
                isSubmitting || createTable.isPending || updateTable.isPending
              }
            />
          </ThemedView>

          <ThemedView style={tw`my-4`} />

          <ThemedView style={tw`gap-4`}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("settings.fields.name")}
                  icon="layout-grid"
                  placeholder={t("settings.placeholders.name")}
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
                  label={t("settings.fields.description")}
                  icon="file-text"
                  placeholder={t("settings.placeholders.description")}
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={errors.description?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="chairs"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("settings.fields.chairs")}
                  icon="users"
                  placeholder={t("settings.placeholders.chairs")}
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  keyboardType="number-pad"
                  error={errors.chairs?.message}
                />
              )}
            />

            {areas.length > 0 && (
              <Controller
                control={control}
                name="areaId"
                render={({ field: { onChange, value } }) => (
                  <Select
                    label={t("areas.field")}
                    options={areaOptions}
                    value={value}
                    onChange={(v) => onChange(String(v))}
                  />
                )}
              />
            )}
          </ThemedView>
        </ScrollView>
      </ScreenLayout>

      <DialogModal
        visible={showDeleteConfirm}
        title={t("settings.deleteTitle")}
        message={t("settings.deleteMessage")}
        confirmLabel={t("settings.confirm")}
        cancelLabel={t("settings.cancel")}
        confirmVariant="destructive"
        loading={deleteTable.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </KeyboardAvoidingView>
  );
}
