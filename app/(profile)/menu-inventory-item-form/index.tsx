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
import Select from "@/presentation/theme/components/select";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useInventoryItemCategories } from "@/presentation/inventory/hooks/useInventoryItemCategories";
import { InventoryUnit } from "@/core/inventory/models/inventory-item.model";

const buildItemSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(2, t("validations.nameMinLength")),
    unit: z.nativeEnum(InventoryUnit),
    quantity: z.string().optional(),
    minimumQuantity: z.string().optional(),
    isActive: z.boolean(),
    categoryId: z.string().optional(),
  });

type ItemFormData = z.infer<ReturnType<typeof buildItemSchema>>;

export default function MenuInventoryItemFormScreen() {
  const { t } = useTranslation("inventory");
  const params = useLocalSearchParams<{
    itemId?: string;
    name?: string;
    unit?: string;
    quantity?: string;
    minimumQuantity?: string;
    isActive?: string;
    categoryId?: string;
  }>();

  const isEditing = !!params.itemId;
  const { createItem, updateItem } = useInventoryItems();
  const { categories } = useInventoryItemCategories();

  const schema = buildItemSchema(t);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: params.name || "",
      unit: (params.unit as InventoryUnit) || InventoryUnit.UNIT,
      quantity: params.quantity || "",
      minimumQuantity: params.minimumQuantity || "",
      isActive: params.isActive !== "false",
      categoryId: params.categoryId || "",
    },
  });

  const unitOptions = Object.values(InventoryUnit).map((unit) => ({
    label: t(`units.${unit}`),
    value: unit,
  }));

  const categoryOptions = [
    { label: t("categories.none"), value: "" },
    ...categories.map((category) => ({
      label: category.name,
      value: category.id,
    })),
  ];

  const onSubmit = async (data: ItemFormData) => {
    const payload = {
      name: data.name.trim(),
      unit: data.unit,
      quantity: data.quantity ? Number(data.quantity) : undefined,
      minimumQuantity: data.minimumQuantity
        ? Number(data.minimumQuantity)
        : undefined,
      isActive: data.isActive,
      categoryId: data.categoryId ? data.categoryId : null,
    };

    if (isEditing) {
      await updateItem.mutateAsync({ ...payload, id: params.itemId! });
    } else {
      await createItem.mutateAsync(payload);
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
                {isEditing ? t("editItem") : t("createItem")}
              </ThemedText>
            </ThemedView>
            <Button
              label={isEditing ? t("save") : t("create")}
              size="small"
              onPress={handleSubmit(onSubmit)}
              loading={
                isSubmitting || createItem.isPending || updateItem.isPending
              }
              disabled={
                isSubmitting || createItem.isPending || updateItem.isPending
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
                  label={t("fields.name")}
                  icon="cube"
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
              name="unit"
              render={({ field: { value, onChange } }) => (
                <Select
                  label={t("fields.unit")}
                  options={unitOptions}
                  value={value}
                  onChange={(v) => onChange(v as InventoryUnit)}
                  placeholder={t("placeholders.unit")}
                />
              )}
            />

            <ThemedView style={tw`gap-2`}>
              <Controller
                control={control}
                name="categoryId"
                render={({ field: { value, onChange } }) => (
                  <Select
                    label={t("fields.category")}
                    options={categoryOptions}
                    value={value || ""}
                    onChange={(v) => onChange(String(v))}
                    placeholder={t("placeholders.category")}
                  />
                )}
              />
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(profile)/menu-inventory-categories",
                  })
                }
                style={({ pressed }) => tw.style(pressed && "opacity-70")}
              >
                <ThemedText type="small" style={tw`text-light-primary ml-2`}>
                  {t("categories.manageCategories")}
                </ThemedText>
              </Pressable>
            </ThemedView>

            <ThemedView style={tw`flex-row gap-3`}>
              <ThemedView style={tw`flex-1`}>
                <Controller
                  control={control}
                  name="quantity"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label={t("fields.quantity")}
                      placeholder={t("placeholders.quantity")}
                      onBlur={onBlur}
                      value={value}
                      onChangeText={onChange}
                      keyboardType="decimal-pad"
                    />
                  )}
                />
              </ThemedView>
              <ThemedView style={tw`flex-1`}>
                <Controller
                  control={control}
                  name="minimumQuantity"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label={t("fields.minimumQuantity")}
                      placeholder={t("placeholders.minimumQuantity")}
                      onBlur={onBlur}
                      value={value}
                      onChangeText={onChange}
                      keyboardType="decimal-pad"
                    />
                  )}
                />
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </ScrollView>
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}
