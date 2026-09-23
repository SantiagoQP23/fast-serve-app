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
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import Switch from "@/presentation/theme/components/switch";
import Select from "@/presentation/theme/components/select";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { InventoryUnit } from "@/core/inventory/models/inventory-item.model";

const buildItemSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(2, t("validations.nameMinLength")),
    unit: z.nativeEnum(InventoryUnit),
    quantity: z.string().optional(),
    quantityPerUnit: z
      .string()
      .refine(
        (v) => !Number.isNaN(Number(v)) && Number(v) >= 0.01,
        t("validations.quantityPerUnitInvalid"),
      ),
    minStock: z.string().optional(),
    unitCost: z.string().optional(),
    trackStock: z.boolean(),
  });

type ItemFormData = z.infer<ReturnType<typeof buildItemSchema>>;

export default function MenuInventoryItemFormScreen() {
  const { t } = useTranslation("inventory");
  const params = useLocalSearchParams<{
    itemId?: string;
    productOptionId: string;
    name?: string;
    unit?: string;
    quantity?: string;
    quantityPerUnit?: string;
    minStock?: string;
    unitCost?: string;
    trackStock?: string;
  }>();

  const isEditing = !!params.itemId;
  const productOptionId = Number(params.productOptionId);
  const { createItem, updateItem, deleteItem } =
    useInventoryItems(productOptionId);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      quantityPerUnit: params.quantityPerUnit || "1",
      minStock: params.minStock || "",
      unitCost: params.unitCost || "",
      trackStock: params.trackStock !== "false",
    },
  });

  const unitOptions = Object.values(InventoryUnit).map((unit) => ({
    label: t(`units.${unit}`),
    value: unit,
  }));

  const onSubmit = async (data: ItemFormData) => {
    const payload = {
      name: data.name.trim(),
      unit: data.unit,
      quantity: data.quantity ? Number(data.quantity) : undefined,
      quantityPerUnit: Number(data.quantityPerUnit),
      minStock: data.minStock ? Number(data.minStock) : undefined,
      unitCost: data.unitCost ? Number(data.unitCost) : undefined,
      trackStock: data.trackStock,
      productOptionId,
    };

    if (isEditing) {
      await updateItem.mutateAsync({ ...payload, id: params.itemId! });
    } else {
      await createItem.mutateAsync(payload);
    }

    router.back();
  };

  const handleConfirmDelete = async () => {
    if (!params.itemId) return;
    await deleteItem.mutateAsync(params.itemId);
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
                      editable={!isEditing}
                    />
                  )}
                />
              </ThemedView>
              <ThemedView style={tw`flex-1`}>
                <Controller
                  control={control}
                  name="quantityPerUnit"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label={t("fields.quantityPerUnit")}
                      placeholder={t("placeholders.quantityPerUnit")}
                      onBlur={onBlur}
                      value={value}
                      onChangeText={onChange}
                      keyboardType="decimal-pad"
                      error={errors.quantityPerUnit?.message}
                    />
                  )}
                />
              </ThemedView>
            </ThemedView>
            {isEditing && (
              <ThemedText type="small" style={tw`text-gray-500 -mt-2`}>
                {t("quantityEditHint")}
              </ThemedText>
            )}

            <ThemedView style={tw`flex-row gap-3`}>
              <ThemedView style={tw`flex-1`}>
                <Controller
                  control={control}
                  name="minStock"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label={t("fields.minStock")}
                      placeholder={t("placeholders.minStock")}
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
                  name="unitCost"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label={t("fields.unitCost")}
                      placeholder={t("placeholders.unitCost")}
                      onBlur={onBlur}
                      value={value}
                      onChangeText={onChange}
                      keyboardType="decimal-pad"
                    />
                  )}
                />
              </ThemedView>
            </ThemedView>

            <Controller
              control={control}
              name="trackStock"
              render={({ field: { value, onChange } }) => (
                <Switch
                  label={t("fields.trackStock")}
                  value={value}
                  onValueChange={onChange}
                />
              )}
            />

            {isEditing && (
              <Button
                label={t("deleteItem")}
                variant="destructive"
                onPress={() => setShowDeleteConfirm(true)}
              />
            )}
          </ThemedView>
        </ScrollView>
      </ScreenLayout>

      <DialogModal
        visible={showDeleteConfirm}
        title={t("deleteTitle")}
        message={t("deleteMessage")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        loading={deleteItem.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </KeyboardAvoidingView>
  );
}
