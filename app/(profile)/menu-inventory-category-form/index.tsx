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
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useInventoryItemCategories } from "@/presentation/inventory/hooks/useInventoryItemCategories";

const buildCategorySchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(2, t("categories.validations.nameMinLength")),
    isActive: z.boolean(),
  });

type CategoryFormData = z.infer<ReturnType<typeof buildCategorySchema>>;

export default function MenuInventoryCategoryFormScreen() {
  const { t } = useTranslation("inventory");
  const params = useLocalSearchParams<{
    categoryId?: string;
    name?: string;
    isActive?: string;
  }>();

  const isEditing = !!params.categoryId;
  const { createCategory, updateCategory } = useInventoryItemCategories();

  const schema = buildCategorySchema(t);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: params.name || "",
      isActive: params.isActive !== "false",
    },
  });

  const onSubmit = async (data: CategoryFormData) => {
    if (isEditing) {
      await updateCategory.mutateAsync({
        id: params.categoryId!,
        name: data.name.trim(),
        isActive: data.isActive,
      });
    } else {
      await createCategory.mutateAsync({
        name: data.name.trim(),
        isActive: data.isActive,
      });
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
          <ThemedView style={tw`items-center gap-2 flex-row justify-between`}>
            <ThemedView style={tw`items-center gap-4 flex-row`}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => tw.style(pressed && "opacity-70")}
              >
                <Ionicons name="arrow-back-outline" size={24} />
              </Pressable>
              <ThemedText type="h3" style={{ fontFamily: typography.regular }}>
                {isEditing
                  ? t("categories.editCategory")
                  : t("categories.createCategory")}
              </ThemedText>
            </ThemedView>
            <Button
              label={isEditing ? t("save") : t("create")}
              size="small"
              onPress={handleSubmit(onSubmit)}
              loading={
                isSubmitting ||
                createCategory.isPending ||
                updateCategory.isPending
              }
              disabled={
                isSubmitting ||
                createCategory.isPending ||
                updateCategory.isPending
              }
            />
          </ThemedView>

          <ThemedView style={tw`my-6`} />

          <ThemedView style={tw`gap-4`}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("categories.fields.name")}
                  icon="folder"
                  placeholder={t("categories.placeholders.name")}
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={errors.name?.message}
                />
              )}
            />
          </ThemedView>
        </ScrollView>
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}
