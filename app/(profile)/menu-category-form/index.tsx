import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyboardAvoidingView, Pressable, ScrollView, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useMenuManagement } from "@/presentation/menu-management/hooks/useMenuManagement";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import Checkbox from "@/presentation/theme/components/checkbox";
import Select from "@/presentation/theme/components/select";
import tw from "@/presentation/theme/lib/tailwind";

const buildCategorySchema = (t: (key: string) => string) =>
  z.object({
    name: z
      .string()
      .min(2, t("categories.validations.nameMinLength"))
      .max(60, t("categories.validations.nameMaxLength")),
    sectionId: z.string().min(1, t("categories.validations.sectionRequired")),
    isActive: z.boolean(),
    isPublic: z.boolean(),
  });

type CategoryFormData = z.infer<ReturnType<typeof buildCategorySchema>>;

export default function MenuCategoryFormScreen() {
  const { t } = useTranslation("menuManagement");
  const params = useLocalSearchParams<{
    categoryId?: string;
    name?: string;
    sectionId?: string;
    isActive?: string;
    isPublic?: string;
  }>();

  const isEditing = !!params.categoryId;

  const { sections } = useMenu();
  const { createCategory, updateCategory } = useMenuManagement();

  const schema = buildCategorySchema(t);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: params.name || "",
      sectionId: params.sectionId || "",
      isActive: params.isActive !== "false",
      isPublic: params.isPublic !== "false",
    },
  });

  const onSubmit = async (data: CategoryFormData) => {
    if (isEditing) {
      await updateCategory.mutateAsync({
        id: params.categoryId!,
        name: data.name.trim(),
        sectionId: data.sectionId,
        isActive: data.isActive,
        isPublic: data.isPublic,
      });
    } else {
      await createCategory.mutateAsync({
        name: data.name.trim(),
        sectionId: data.sectionId,
      });
    }

    router.back();
  };

  const sectionOptions = sections.map((section) => ({
    label: section.name,
    value: section.id,
  }));

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
          <ThemedView style={tw`items-center gap-2 flex-row`}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => tw.style(pressed && "opacity-70")}
            >
              <Ionicons name="arrow-back-outline" size={24} />
            </Pressable>
            <ThemedText type="h2">
              {isEditing
                ? t("categories.editCategory")
                : t("categories.createCategory")}
            </ThemedText>
          </ThemedView>

          <ThemedView style={tw`my-6`} />

          <ThemedView style={tw`gap-4`}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("categories.fields.name")}
                  icon="pricetag-outline"
                  placeholder={t("categories.placeholders.name")}
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={errors.name?.message}
                />
              )}
            />

            {sections.length === 0 ? (
              <ThemedView
                style={tw`items-center py-6 gap-2 bg-gray-50 dark:bg-gray-800 rounded-3xl px-4`}
              >
                <Ionicons
                  name="list-outline"
                  size={32}
                  color={tw.color("gray-400")}
                />
                <ThemedText type="body2" style={tw`font-semibold`}>
                  {t("categories.noSectionsAvailable")}
                </ThemedText>
                <ThemedText type="small" style={tw`text-center text-gray-500`}>
                  {t("categories.noSectionsAvailableDescription")}
                </ThemedText>
              </ThemedView>
            ) : (
              <Controller
                control={control}
                name="sectionId"
                render={({ field: { value, onChange } }) => (
                  <Select
                    label={t("categories.fields.section")}
                    options={sectionOptions}
                    value={value}
                    onChange={(v) => onChange(String(v))}
                    placeholder={t("categories.placeholders.section")}
                  />
                )}
              />
            )}
            {errors.sectionId && (
              <ThemedText type="small" style={tw`text-red-500 -mt-2 ml-2`}>
                {errors.sectionId.message}
              </ThemedText>
            )}

            {isEditing && (
              <ThemedView style={tw`gap-3 mt-2`}>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field: { value, onChange } }) => (
                    <Checkbox
                      label={t("categories.fields.isActive")}
                      value={value}
                      onValueChange={onChange}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="isPublic"
                  render={({ field: { value, onChange } }) => (
                    <Checkbox
                      label={t("categories.fields.isPublic")}
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
            label={
              isEditing ? t("categories.saveCategory") : t("categories.createCategory")
            }
            onPress={handleSubmit(onSubmit)}
            loading={
              isSubmitting || createCategory.isPending || updateCategory.isPending
            }
            disabled={
              isSubmitting ||
              createCategory.isPending ||
              updateCategory.isPending ||
              sections.length === 0
            }
          />
        </ScrollView>
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}
