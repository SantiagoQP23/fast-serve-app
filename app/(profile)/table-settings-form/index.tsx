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
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useTablesManagement } from "@/presentation/tables/hooks/useTablesManagement";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import Checkbox from "@/presentation/theme/components/checkbox";
import Switch from "@/presentation/theme/components/switch";
import IconButton from "@/presentation/theme/components/icon-button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import tw from "@/presentation/theme/lib/tailwind";

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
    isActive: z.boolean(),
    isAvailable: z.boolean(),
  });

type TableFormData = z.infer<ReturnType<typeof buildTableSchema>>;

export default function TableSettingsFormScreen() {
  const { t } = useTranslation("tables");
  const params = useLocalSearchParams<{
    tableId?: string;
    name?: string;
    description?: string;
    chairs?: string;
    isActive?: string;
    isAvailable?: string;
  }>();

  const isEditing = !!params.tableId;

  const { createTable, updateTable, deleteTable } = useTablesManagement();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      isActive: params.isActive !== "false",
      isAvailable: params.isAvailable !== "false",
    },
  });

  const onSubmit = async (data: TableFormData) => {
    if (isEditing) {
      await updateTable.mutateAsync({
        id: params.tableId!,
        name: data.name.trim(),
        description: data.description?.trim() || "",
        chairs: Number(data.chairs),
        isActive: data.isActive,
        isAvailable: data.isAvailable,
      });
    } else {
      await createTable.mutateAsync({
        name: data.name.trim(),
        description: data.description?.trim() || "",
        chairs: Number(data.chairs),
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
            <ThemedView style={tw`items-center gap-2 flex-row`}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => tw.style(pressed && "opacity-70")}
              >
                <Ionicons name="arrow-back-outline" size={24} />
              </Pressable>
              <ThemedText type="h2">
                {isEditing
                  ? t("settings.editTable")
                  : t("settings.createTable")}
              </ThemedText>
            </ThemedView>
            {isEditing && (
              <IconButton
                icon="trash-outline"
                size={18}
                variant="destructive"
                onPress={() => setShowDeleteConfirm(true)}
              />
            )}
          </ThemedView>

          <ThemedView style={tw`my-6`} />

          <ThemedView style={tw`gap-4`}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("settings.fields.name")}
                  icon="grid-outline"
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
                  icon="document-text-outline"
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
                  icon="people-outline"
                  placeholder={t("settings.placeholders.chairs")}
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  keyboardType="number-pad"
                  error={errors.chairs?.message}
                />
              )}
            />

            {isEditing && (
              <ThemedView style={tw`gap-3 mt-2`}>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field: { value, onChange } }) => (
                    <Switch
                      label={t("settings.fields.isActive")}
                      value={value}
                      onValueChange={onChange}
                    />
                  )}
                />
                {/* <Controller */}
                {/*   control={control} */}
                {/*   name="isAvailable" */}
                {/*   render={({ field: { value, onChange } }) => ( */}
                {/*     <Checkbox */}
                {/*       label={t("settings.fields.isAvailable")} */}
                {/*       value={value} */}
                {/*       onValueChange={onChange} */}
                {/*     /> */}
                {/*   )} */}
                {/* /> */}
              </ThemedView>
            )}
          </ThemedView>

          <ThemedView style={tw`my-4`} />

          <Button
            label={
              isEditing ? t("settings.saveTable") : t("settings.createTable")
            }
            onPress={handleSubmit(onSubmit)}
            loading={
              isSubmitting || createTable.isPending || updateTable.isPending
            }
            disabled={
              isSubmitting || createTable.isPending || updateTable.isPending
            }
          />
        </ScrollView>
      </ScreenLayout>

      <DialogModal
        visible={showDeleteConfirm}
        title={t("settings.deleteTitle")}
        message={t("settings.deleteMessage")}
        confirmText={t("settings.confirm")}
        cancelText={t("settings.cancel")}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </KeyboardAvoidingView>
  );
}
