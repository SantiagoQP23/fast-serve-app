import { useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
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
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useMenuManagement } from "@/presentation/menu-management/hooks/useMenuManagement";
import { useProductionAreas } from "@/presentation/production-areas/hooks/useProductionAreas";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import Checkbox from "@/presentation/theme/components/checkbox";
import Chip from "@/presentation/theme/components/chip";
import Card from "@/presentation/theme/components/card";
import IconButton from "@/presentation/theme/components/icon-button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import type { ProductOption } from "@/core/menu/models/product-optionl.model";

const isValidNumber = (v: string) =>
  v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0);

const buildProductSchema = (t: (key: string) => string) =>
  z.object({
    name: z
      .string()
      .min(2, t("products.validations.nameMinLength"))
      .max(80, t("products.validations.nameMaxLength")),
    description: z.string().optional(),
    price: z
      .string()
      .refine(
        (v) => !Number.isNaN(Number(v)) && Number(v) >= 0,
        t("products.validations.priceInvalid"),
      ),
    categoryId: z.string().min(1, t("products.validations.categoryRequired")),
    productionAreaId: z.string().optional(),
    isPublic: z.boolean(),
    options: z.array(
      z.object({
        name: z
          .string()
          .min(1, t("products.variants.validations.nameRequired")),
        price: z
          .string()
          .refine(
            isValidNumber,
            t("products.variants.validations.priceInvalid"),
          ),
        isDefault: z.boolean(),
      }),
    ),
  });

type ProductFormData = z.infer<ReturnType<typeof buildProductSchema>>;

const buildDefaultOption = () => ({
  name: "",
  price: "",
  isDefault: false,
});

export default function MenuProductFormScreen() {
  const { t } = useTranslation("menuManagement");
  const params = useLocalSearchParams<{
    productId?: string;
    name?: string;
    description?: string;
    price?: string;
    categoryId?: string;
    productionAreaId?: string;
    isPublic?: string;
    options?: string;
  }>();

  const isEditing = !!params.productId;

  const { categories } = useMenu();
  const { createProduct, updateProduct, deleteProduct } = useMenuManagement();
  const { getAllQuery: productionAreasQuery } = useProductionAreas();
  const productionAreas = productionAreasQuery.data ?? [];

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const categoryPickerRef = useRef<BottomSheetPickerRef>(null);
  const productionAreaPickerRef = useRef<BottomSheetPickerRef>(null);

  const schema = buildProductSchema(t);

  const initialOptions = useMemo(() => {
    if (!params.options) return [];
    try {
      const parsed = JSON.parse(params.options) as ProductOption[];
      return parsed.map((option) => ({
        name: option.name,
        price: option.price != null ? String(option.price) : "",
        isDefault: !!option.isDefault,
      }));
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: params.name || "",
      description: params.description || "",
      price: params.price || "",
      categoryId: params.categoryId || "",
      productionAreaId: params.productionAreaId || "",
      isPublic: params.isPublic !== "false",
      options: initialOptions,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  const handleSetDefaultOption = (index: number) => {
    fields.forEach((_, idx) => {
      setValue(`options.${idx}.isDefault`, idx === index);
    });
  };

  const onSubmit = async (data: ProductFormData) => {
    const payload = {
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      price: Number(data.price),
      categoryId: data.categoryId,
      productionAreaId: data.productionAreaId
        ? Number(data.productionAreaId)
        : undefined,
      productOptions:
        data.options.length > 0
          ? data.options.map((opt) => ({
              name: opt.name.trim(),
              price: Number(opt.price) || 0,
              isDefault: opt.isDefault,
              trackStock: false,
            }))
          : undefined,
    };

    if (isEditing) {
      await updateProduct.mutateAsync({
        ...payload,
        id: params.productId!,
        isPublic: data.isPublic,
      });
    } else {
      await createProduct.mutateAsync(payload);
    }

    router.back();
  };

  const handleConfirmDelete = async () => {
    if (!params.productId) return;
    await deleteProduct.mutateAsync(params.productId);
    setShowDeleteConfirm(false);
    router.back();
  };

  const categoryOptions = categories.map((category) => ({
    label: category.name,
    value: category.id,
  }));

  const productionAreaOptions = productionAreas.map((area) => ({
    label: area.name,
    value: String(area.id),
  }));

  const categoryIdValue = watch("categoryId");
  const productionAreaIdValue = watch("productionAreaId");

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
                  ? t("products.editProduct")
                  : t("products.createProduct")}
              </ThemedText>
            </ThemedView>
            <Button
              label={isEditing ? t("products.save") : t("products.create")}
              size="small"
              onPress={handleSubmit(onSubmit)}
              loading={
                isSubmitting ||
                createProduct.isPending ||
                updateProduct.isPending
              }
              disabled={
                isSubmitting ||
                createProduct.isPending ||
                updateProduct.isPending ||
                (!isEditing && categories.length === 0)
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
                  label={t("products.fields.name")}
                  icon="fast-food-outline"
                  placeholder={t("products.placeholders.name")}
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
                  label={t("products.fields.description")}
                  icon="document-text-outline"
                  placeholder={t("products.placeholders.description")}
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

            {!isEditing && (
              <>
                <Controller
                  control={control}
                  name="price"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label={t("products.fields.price")}
                      icon="pricetag-outline"
                      placeholder={t("products.placeholders.price")}
                      onBlur={onBlur}
                      value={value}
                      onChangeText={onChange}
                      keyboardType="decimal-pad"
                      error={errors.price?.message}
                    />
                  )}
                />

                {categories.length === 0 ? (
                  <ThemedView
                    style={tw`items-center py-6 gap-2 bg-gray-50 dark:bg-gray-800 rounded-3xl px-4`}
                  >
                    <Ionicons
                      name="pricetag-outline"
                      size={32}
                      color={tw.color("gray-400")}
                    />
                    <ThemedText type="body2" style={tw`font-semibold`}>
                      {t("products.noCategoriesAvailable")}
                    </ThemedText>
                    <ThemedText
                      type="small"
                      style={tw`text-center text-gray-500`}
                    >
                      {t("products.noCategoriesAvailableDescription")}
                    </ThemedText>
                  </ThemedView>
                ) : (
                  <Controller
                    control={control}
                    name="categoryId"
                    render={({ field: { value } }) => {
                      const selectedCategory = categories.find(
                        (category) => category.id === value,
                      );
                      return (
                        <ThemedView style={tw`gap-2`}>
                          <ThemedText style={tw`ml-2`}>
                            {t("products.fields.category")}
                          </ThemedText>
                          <ThemedView style={tw`flex-row`}>
                            <Chip
                              label={
                                selectedCategory?.name ??
                                t("products.placeholders.category")
                              }
                              selected={!!selectedCategory}
                              rightContent={
                                <Ionicons
                                  name="chevron-down"
                                  size={16}
                                  color={
                                    selectedCategory ? "white" : "#4b5563"
                                  }
                                />
                              }
                              onPress={() =>
                                categoryPickerRef.current?.present()
                              }
                            />
                          </ThemedView>
                        </ThemedView>
                      );
                    }}
                  />
                )}
                {errors.categoryId && (
                  <ThemedText
                    type="small"
                    style={tw`text-red-500 -mt-2 ml-2`}
                  >
                    {errors.categoryId.message}
                  </ThemedText>
                )}

                <Controller
                  control={control}
                  name="productionAreaId"
                  render={({ field: { value } }) => {
                    const selectedArea = productionAreas.find(
                      (area) => String(area.id) === value,
                    );
                    return (
                      <ThemedView style={tw`gap-2`}>
                        <ThemedText style={tw`ml-2`}>
                          {t("products.fields.productionArea")}
                        </ThemedText>
                        <ThemedView style={tw`flex-row`}>
                          <Chip
                            label={
                              selectedArea?.name ??
                              t("products.placeholders.productionArea")
                            }
                            selected={!!selectedArea}
                            rightContent={
                              <Ionicons
                                name="chevron-down"
                                size={16}
                                color={selectedArea ? "white" : "#4b5563"}
                              />
                            }
                            onPress={() =>
                              productionAreaPickerRef.current?.present()
                            }
                          />
                        </ThemedView>
                      </ThemedView>
                    );
                  }}
                />
              </>
            )}
          </ThemedView>

          {!isEditing && (
            <>
              <ThemedView style={tw`my-8`} />

              {/* Variants */}
              <ThemedView style={tw`gap-4`}>
                <ThemedView style={tw`flex-row items-center justify-between`}>
                  <ThemedText type="h4">
                    {t("products.variants.title")}
                  </ThemedText>
                  <Button
                    label={t("products.variants.addVariant")}
                    onPress={() => append(buildDefaultOption())}
                    variant="outline"
                    size="small"
                    leftIcon="add-outline"
                  />
                </ThemedView>

                {fields.length === 0 ? (
                  <ThemedView
                    style={tw`items-center py-6 gap-2 bg-gray-50 dark:bg-gray-800 rounded-3xl px-4`}
                  >
                    <Ionicons
                      name="options-outline"
                      size={32}
                      color={tw.color("gray-400")}
                    />
                    <ThemedText
                      type="body2"
                      style={tw`text-center text-gray-500`}
                    >
                      {t("products.variants.empty")}
                    </ThemedText>
                  </ThemedView>
                ) : (
                  <ThemedView style={tw`gap-3`}>
                    {fields.map((field, index) => (
                      <Card key={field.id}>
                        <ThemedView style={tw`gap-4`}>
                          <ThemedView
                            style={tw`flex-row items-center justify-between`}
                          >
                            <ThemedText
                              type="body1"
                              style={tw`font-semibold`}
                            >
                              {t("products.variants.variantNumber", {
                                number: index + 1,
                              })}
                            </ThemedText>
                            <IconButton
                              icon="trash-outline"
                              size={18}
                              variant="destructive"
                              onPress={() => remove(index)}
                            />
                          </ThemedView>

                          <Controller
                            control={control}
                            name={`options.${index}.name`}
                            render={({
                              field: { onChange, onBlur, value },
                            }) => (
                              <TextInput
                                label={t("products.variants.fields.name")}
                                placeholder={t(
                                  "products.variants.placeholders.name",
                                )}
                                onBlur={onBlur}
                                value={value}
                                onChangeText={onChange}
                                error={errors.options?.[index]?.name?.message}
                              />
                            )}
                          />

                          <Controller
                            control={control}
                            name={`options.${index}.price`}
                            render={({
                              field: { onChange, onBlur, value },
                            }) => (
                              <TextInput
                                label={t("products.variants.fields.price")}
                                placeholder={t(
                                  "products.variants.placeholders.price",
                                )}
                                onBlur={onBlur}
                                value={value}
                                onChangeText={onChange}
                                keyboardType="decimal-pad"
                                error={
                                  errors.options?.[index]?.price?.message
                                }
                              />
                            )}
                          />

                          <Controller
                            control={control}
                            name={`options.${index}.isDefault`}
                            render={({ field: { value } }) => (
                              <Checkbox
                                label={t(
                                  "products.variants.fields.isDefault",
                                )}
                                value={value}
                                onValueChange={() =>
                                  handleSetDefaultOption(index)
                                }
                                size="small"
                              />
                            )}
                          />
                        </ThemedView>
                      </Card>
                    ))}
                  </ThemedView>
                )}
              </ThemedView>
            </>
          )}
        </ScrollView>
      </ScreenLayout>

      <DialogModal
        visible={showDeleteConfirm}
        title={t("products.deleteTitle")}
        message={t("products.deleteMessage")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <BottomSheetPicker
        ref={categoryPickerRef}
        title={t("products.fields.category")}
        options={categoryOptions}
        value={categoryIdValue}
        onChange={(value) =>
          setValue("categoryId", String(value), { shouldValidate: true })
        }
      />

      <BottomSheetPicker
        ref={productionAreaPickerRef}
        title={t("products.fields.productionArea")}
        options={productionAreaOptions}
        value={productionAreaIdValue}
        onChange={(value) => setValue("productionAreaId", String(value))}
      />
    </KeyboardAvoidingView>
  );
}
