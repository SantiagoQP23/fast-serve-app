import { useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  KeyboardAvoidingView,
  LayoutAnimation,
  Pressable,
  ScrollView,
  Platform,
  UIManager,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useMenuManagement } from "@/presentation/menu-management/hooks/useMenuManagement";
import { useProductionAreas } from "@/presentation/production-areas/hooks/useProductionAreas";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import ButtonGroup from "@/presentation/theme/components/button-group";
import TextInput from "@/presentation/theme/components/text-input";
import Checkbox from "@/presentation/theme/components/checkbox";
import Card from "@/presentation/theme/components/card";
import Label from "@/presentation/theme/components/label";
import SwipeableRow from "@/presentation/theme/components/swipeable-row";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import Select from "@/presentation/theme/components/select";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import type { ProductOption } from "@/core/menu/models/product-optionl.model";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const isValidNumber = (v: string) =>
  v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0);

const buildProductSchema = (t: (key: string) => string) =>
  z
    .object({
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
      productionAreaId: z
        .string()
        .min(1, t("products.validations.productionAreaRequired")),
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
    })
    .superRefine((data, ctx) => {
      if (data.options.length === 0 && Number(data.price) < 0.25) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["price"],
          message: t("products.validations.priceMin"),
        });
      }
    });

type ProductFormData = z.infer<ReturnType<typeof buildProductSchema>>;
type PricingMode = "unique" | "variants";
type VariantDraft = { name: string; price: string; isDefault: boolean };

const emptyVariantDraft: VariantDraft = {
  name: "",
  price: "",
  isDefault: false,
};

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
  const hasPresetCategory = !isEditing && !!params.categoryId;

  const { categories } = useMenu();
  const { createProduct, updateProduct, deleteProduct } = useMenuManagement();
  const { getAllQuery: productionAreasQuery } = useProductionAreas();
  const productionAreas = productionAreasQuery.data ?? [];

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [pricingMode, setPricingMode] = useState<PricingMode>("unique");
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(
    null,
  );
  const [variantDraft, setVariantDraft] =
    useState<VariantDraft>(emptyVariantDraft);
  const variantSheetRef = useRef<BottomSheetMethods>(null);

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
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
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

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "options",
  });

  const animateLayout = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const handlePricingModeChange = (mode: PricingMode) => {
    animateLayout();
    setPricingMode(mode);
    if (mode === "unique" && fields.length > 0) {
      remove();
    }
  };

  const handleRemoveVariant = (index: number) => {
    animateLayout();
    remove(index);
  };

  const openAddVariant = () => {
    setEditingVariantIndex(null);
    setVariantDraft({ ...emptyVariantDraft, isDefault: fields.length === 0 });
    variantSheetRef.current?.present();
  };

  const openEditVariant = (index: number) => {
    const variant = fields[index];
    setEditingVariantIndex(index);
    setVariantDraft({
      name: variant.name,
      price: variant.price,
      isDefault: variant.isDefault,
    });
    variantSheetRef.current?.present();
  };

  const closeVariantSheet = () => {
    variantSheetRef.current?.close();
  };

  const handleSaveVariant = () => {
    const trimmedName = variantDraft.name.trim();
    if (!trimmedName) return;

    animateLayout();

    if (editingVariantIndex === null) {
      // The first variant of the product is always its default.
      const isDefault = fields.length === 0 ? true : variantDraft.isDefault;
      if (isDefault) {
        fields.forEach((field, idx) => {
          if (field.isDefault) {
            update(idx, { ...field, isDefault: false });
          }
        });
      }
      append({ name: trimmedName, price: variantDraft.price, isDefault });
    } else {
      // The only remaining variant can't be un-defaulted.
      const isDefault = fields.length === 1 ? true : variantDraft.isDefault;
      fields.forEach((field, idx) => {
        if (idx === editingVariantIndex) {
          update(idx, {
            name: trimmedName,
            price: variantDraft.price,
            isDefault,
          });
        } else if (isDefault && field.isDefault) {
          update(idx, { ...field, isDefault: false });
        }
      });
    }

    closeVariantSheet();
  };

  const handleDeleteVariant = () => {
    if (editingVariantIndex === null) return;
    animateLayout();
    remove(editingVariantIndex);
    closeVariantSheet();
  };

  const handleNext = async () => {
    const valid = await trigger([
      "name",
      "description",
      "categoryId",
      "productionAreaId",
    ]);
    if (!valid) return;
    animateLayout();
    setStep(2);
  };

  const handleBack = () => {
    if (!isEditing && step === 2) {
      animateLayout();
      setStep(1);
      return;
    }
    router.back();
  };

  const onSubmit = async (data: ProductFormData) => {
    const hasVariants = data.options.length > 0;

    const payload = {
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      price: Number(data.price),
      categoryId: data.categoryId,
      productionAreaId: Number(data.productionAreaId),
      hasVariants,
      trackStock: hasVariants ? undefined : false,
      quantity: hasVariants ? undefined : 0,
      productOptions: data.options.map((opt) => ({
        name: opt.name.trim(),
        price: Number(opt.price) || 0,
        isDefault: opt.isDefault,
        trackStock: false,
      })),
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

  const pricingModeOptions = [
    { label: t("products.pricingMode.unique"), value: "unique" },
    { label: t("products.pricingMode.variants"), value: "variants" },
  ];

  const isOnlyVariant =
    editingVariantIndex === null ? fields.length === 0 : fields.length === 1;

  const isCreateDisabled =
    isSubmitting ||
    createProduct.isPending ||
    (pricingMode === "variants" && fields.length === 0);

  return (
    <KeyboardAvoidingView
      style={tw`flex-1`}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`${!isEditing ? "pb-32" : "pb-8"}`}
        >
          <ThemedView style={tw`items-center gap-2 flex-row justify-between`}>
            <ThemedView style={tw`items-center gap-4 flex-row`}>
              <Pressable
                onPress={handleBack}
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
            {isEditing && (
              <Button
                label={t("products.save")}
                size="small"
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting || updateProduct.isPending}
                disabled={isSubmitting || updateProduct.isPending}
              />
            )}
          </ThemedView>

          <ThemedView style={tw`my-6`} />

          {(isEditing || step === 1) && (
            <ThemedView style={tw`gap-4`}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label={t("products.fields.name")}
                    icon="fast-food"
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
                    icon="document-text"
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
                  {!hasPresetCategory &&
                    (categories.length === 0 ? (
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
                        render={({ field: { value, onChange } }) => (
                          <Select
                            label={t("products.fields.category")}
                            options={categoryOptions}
                            value={value}
                            onChange={(v) => onChange(String(v))}
                            placeholder={t("products.placeholders.category")}
                          />
                        )}
                      />
                    ))}
                  {!hasPresetCategory && errors.categoryId && (
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
                    render={({ field: { value, onChange } }) => (
                      <Select
                        label={t("products.fields.productionArea")}
                        options={productionAreaOptions}
                        value={value}
                        onChange={(v) => onChange(String(v))}
                      />
                    )}
                  />
                  {errors.productionAreaId && (
                    <ThemedText
                      type="small"
                      style={tw`text-red-500 -mt-2 ml-2`}
                    >
                      {errors.productionAreaId.message}
                    </ThemedText>
                  )}
                </>
              )}
            </ThemedView>
          )}

          {!isEditing && step === 2 && (
            <ThemedView style={tw`gap-4`}>
              <ThemedView style={tw`gap-2`}>
                <ThemedText type="small" style={tw`ml-2`}>
                  {t("products.fields.pricingMode")}
                </ThemedText>
                <ButtonGroup
                  options={pricingModeOptions}
                  selected={pricingMode}
                  onChange={handlePricingModeChange}
                />
              </ThemedView>

              {pricingMode === "unique" ? (
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
              ) : (
                <ThemedView style={tw`gap-4`}>
                  <ThemedView style={tw`flex-row items-center justify-between`}>
                    <ThemedText type="h4">
                      {t("products.variants.title")}
                    </ThemedText>
                    <Button
                      label={t("products.variants.addVariant")}
                      onPress={openAddVariant}
                      variant="outline"
                      size="extra-small"
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
                        <SwipeableRow
                          key={field.id}
                          onEdit={() => openEditVariant(index)}
                          onDelete={() => handleRemoveVariant(index)}
                        >
                          <Card onPress={() => openEditVariant(index)}>
                            <ThemedView
                              style={tw`flex-row items-center justify-between gap-3`}
                            >
                              <ThemedView style={tw`gap-1`}>
                                <ThemedText
                                  type="body1"
                                  style={tw`font-semibold`}
                                >
                                  {field.name ||
                                    t("products.variants.variantNumber", {
                                      number: index + 1,
                                    })}
                                </ThemedText>
                                <ThemedText
                                  type="body2"
                                  style={tw`text-gray-500`}
                                >
                                  {formatCurrency(Number(field.price) || 0)}
                                </ThemedText>
                              </ThemedView>
                              {field.isDefault && (
                                <Label
                                  text={t("products.variants.fields.isDefault")}
                                  size="small"
                                  color="outline"
                                  leftIcon="checkmark-circle-outline"
                                />
                              )}
                            </ThemedView>
                          </Card>
                        </SwipeableRow>
                      ))}
                    </ThemedView>
                  )}
                </ThemedView>
              )}
            </ThemedView>
          )}
        </ScrollView>
      </ScreenLayout>

      {!isEditing && (
        <ThemedView
          style={tw`absolute bottom-0 left-0 right-0 bg-light-background dark:bg-black  px-4 py-4`}
        >
          {step === 1 ? (
            <Button label={t("next")} onPress={handleNext} />
          ) : (
            <ThemedView style={tw`flex-row gap-3 justify-between`}>
              <Button label={t("back")} onPress={handleBack} variant="text" />
              <Button
                label={t("products.create")}
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting || createProduct.isPending}
                disabled={isCreateDisabled}
              />
            </ThemedView>
          )}
        </ThemedView>
      )}

      <DialogModal
        visible={showDeleteConfirm}
        title={t("products.deleteTitle")}
        message={t("products.deleteMessage")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ThemedBottomSheetModal ref={variantSheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6 gap-4`}>
          <ThemedText type="h3">
            {editingVariantIndex === null
              ? t("products.variants.addVariant")
              : t("products.variants.editVariant")}
          </ThemedText>

          <TextInput
            bottomSheet
            label={t("products.variants.fields.name")}
            placeholder={t("products.variants.placeholders.name")}
            value={variantDraft.name}
            onChangeText={(v) =>
              setVariantDraft((draft) => ({ ...draft, name: v }))
            }
          />

          <TextInput
            bottomSheet
            label={t("products.variants.fields.price")}
            placeholder={t("products.variants.placeholders.price")}
            value={variantDraft.price}
            onChangeText={(v) =>
              setVariantDraft((draft) => ({ ...draft, price: v }))
            }
            keyboardType="decimal-pad"
          />

          {!isOnlyVariant && (
            <Checkbox
              label={t("products.variants.fields.isDefault")}
              value={variantDraft.isDefault}
              onValueChange={(v) =>
                setVariantDraft((draft) => ({ ...draft, isDefault: v }))
              }
              size="small"
            />
          )}

          <ThemedView style={tw`flex-row gap-3 mt-2`}>
            {editingVariantIndex !== null && (
              <Button
                label={t("delete")}
                variant="destructive"
                onPress={handleDeleteVariant}
                style={tw`flex-1`}
              />
            )}
            <Button
              label={t("confirm")}
              onPress={handleSaveVariant}
              disabled={!variantDraft.name.trim()}
              style={tw`flex-1`}
            />
          </ThemedView>
        </BottomSheetView>
      </ThemedBottomSheetModal>
    </KeyboardAvoidingView>
  );
}
