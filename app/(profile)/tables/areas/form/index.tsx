import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTableAreasManagement } from "@/presentation/tables/hooks/useTableAreasManagement";

const buildSchema = (t: (key: string) => string) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, t("areas.nameRequired"))
      .max(50, t("areas.nameMaxLength")),
  });

type AreaFormData = z.infer<ReturnType<typeof buildSchema>>;

export default function TableAreaFormScreen() {
  const { t } = useTranslation("tables");
  const params = useLocalSearchParams<{ areaId?: string; name?: string }>();
  const isEditing = !!params.areaId;
  const { createArea, updateArea } = useTableAreasManagement();
  const isPending = createArea.isPending || updateArea.isPending;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AreaFormData>({
    resolver: zodResolver(buildSchema(t)),
    defaultValues: { name: params.name || "" },
  });

  // Sin toast de éxito: volver a la lista de zonas lo confirma.
  const onSubmit = async ({ name }: AreaFormData) => {
    if (isEditing) {
      await updateArea.mutateAsync({ id: params.areaId!, name });
    } else {
      await createArea.mutateAsync(name);
    }
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1`}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-8`}>
        <ThemedView style={tw`items-center gap-2 flex-row justify-between`}>
          <ThemedView style={tw`items-center gap-4 flex-row`}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => tw.style(pressed && "opacity-70")}
            >
              <Ionicons name="arrow-back-outline" color={tw.color("on-surface")} size={24} />
            </Pressable>
            <ThemedText type="h3" style={{ fontFamily: typography.regular }}>
              {isEditing ? t("areas.editArea") : t("areas.newArea")}
            </ThemedText>
          </ThemedView>
          <Button
            label={isEditing ? t("areas.save") : t("areas.create")}
            size="small"
            onPress={handleSubmit(onSubmit)}
            loading={isPending}
            disabled={isPending}
          />
        </ThemedView>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label={t("areas.name")}
              icon="albums"
              placeholder={t("areas.namePlaceholder")}
              onBlur={onBlur}
              value={value}
              onChangeText={onChange}
              error={errors.name?.message}
              autoFocus={!isEditing}
            />
          )}
        />
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}
