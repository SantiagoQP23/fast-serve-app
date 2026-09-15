import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyboardAvoidingView, Pressable, ScrollView, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useMenuManagement } from "@/presentation/menu-management/hooks/useMenuManagement";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import Switch from "@/presentation/theme/components/switch";
import IconButton from "@/presentation/theme/components/icon-button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import tw from "@/presentation/theme/lib/tailwind";

const buildSectionSchema = (t: (key: string) => string) =>
  z.object({
    name: z
      .string()
      .min(2, t("sections.validations.nameMinLength"))
      .max(60, t("sections.validations.nameMaxLength")),
    isActive: z.boolean(),
    isPublic: z.boolean(),
  });

type SectionFormData = z.infer<ReturnType<typeof buildSectionSchema>>;

export default function MenuSectionFormScreen() {
  const { t } = useTranslation("menuManagement");
  const params = useLocalSearchParams<{
    sectionId?: string;
    name?: string;
    isActive?: string;
    isPublic?: string;
  }>();

  const isEditing = !!params.sectionId;

  const { createSection, updateSection, deleteSection } = useMenuManagement();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const schema = buildSectionSchema(t);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SectionFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: params.name || "",
      isActive: params.isActive !== "false",
      isPublic: params.isPublic !== "false",
    },
  });

  const onSubmit = async (data: SectionFormData) => {
    if (isEditing) {
      await updateSection.mutateAsync({
        id: params.sectionId!,
        name: data.name.trim(),
        isActive: data.isActive,
        isPublic: data.isPublic,
      });
    } else {
      await createSection.mutateAsync({
        name: data.name.trim(),
      });
    }

    router.back();
  };

  const handleConfirmDelete = async () => {
    if (!params.sectionId) return;
    await deleteSection.mutateAsync(params.sectionId);
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
                  ? t("sections.editSection")
                  : t("sections.createSection")}
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
                  label={t("sections.fields.name")}
                  icon="list-outline"
                  placeholder={t("sections.placeholders.name")}
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={errors.name?.message}
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
                      label={t("sections.fields.isActive")}
                      value={value}
                      onValueChange={onChange}
                    />
                  )}
                />
              </ThemedView>
            )}
          </ThemedView>

          <ThemedView style={tw`my-6`} />

          <Button
            label={isEditing ? t("sections.saveSection") : t("sections.createSection")}
            onPress={handleSubmit(onSubmit)}
            loading={
              isSubmitting || createSection.isPending || updateSection.isPending
            }
            disabled={
              isSubmitting || createSection.isPending || updateSection.isPending
            }
          />
        </ScrollView>
      </ScreenLayout>

      <DialogModal
        visible={showDeleteConfirm}
        title={t("sections.deleteTitle")}
        message={t("sections.deleteMessage")}
        confirmText={t("confirm")}
        cancelText={t("cancel")}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </KeyboardAvoidingView>
  );
}
