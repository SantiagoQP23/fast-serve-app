import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  KeyboardAvoidingView,
  LayoutAnimation,
  Pressable,
  ScrollView,
  Platform,
  UIManager,
  type TextInput as RNTextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
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
import Separator from "@/presentation/theme/components/separator";
import SwipeableRow from "@/presentation/theme/components/swipeable-row";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import Select from "@/presentation/theme/components/select";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import type { ProductOption } from "@/core/menu/models/product-optionl.model";
import type { Product } from "@/core/menu/models/product.model";
import CopyVariantsSheet, {
  type VariantSetOption,
} from "@/presentation/menu-management/components/copy-variants-sheet";
import { useMenuFormStore } from "@/presentation/menu-management/store/useMenuFormStore";

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
      pricingMode: z.enum(["unique", "variants"]),
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
      if (data.pricingMode === "unique" && Number(data.price) < 0.25) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["price"],
          message: t("products.validations.priceMin"),
        });
      }
    });

type ProductFormData = z.infer<ReturnType<typeof buildProductSchema>>;
type VariantDraft = { name: string; price: string; isDefault: boolean };

/**
 * Area to preselect for a new product: the one most used by the category's
 * products, else the last one used on this phone, else the only area.
 */
const getDefaultProductionAreaId = (
  categoryId: string,
  products: Product[],
  areas: { id: number }[],
  lastAreaId: number | null,
): string => {
  const areaIds = new Set(areas.map((area) => area.id));
  const counts = new Map<number, number>();
  products.forEach((product) => {
    const areaId = product.productionArea?.id;
    if (product.category?.id !== categoryId || !areaIds.has(areaId)) return;
    counts.set(areaId, (counts.get(areaId) ?? 0) + 1);
  });
  let bestId: number | null = null;
  counts.forEach((count, areaId) => {
    if (bestId === null || count > counts.get(bestId)!) bestId = areaId;
  });
  if (bestId !== null) return String(bestId);
  if (lastAreaId !== null && areaIds.has(lastAreaId)) return String(lastAreaId);
  if (areas.length === 1) return String(areas[0].id);
  return "";
};

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

  const { categories, products } = useMenu();
  const { lastProductionAreaId, setLastProductionAreaId } = useMenuFormStore();
  const { createProduct, updateProduct, deleteProduct } = useMenuManagement();
  const { getAllQuery: productionAreasQuery } = useProductionAreas();
  const productionAreas = useMemo(
    () => productionAreasQuery.data ?? [],
    [productionAreasQuery.data],
  );

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(
    null,
  );
  const [variantDraft, setVariantDraft] =
    useState<VariantDraft>(emptyVariantDraft);
  const variantSheetRef = useRef<BottomSheetMethods>(null);
  const copyVariantsSheetRef = useRef<BottomSheetMethods>(null);
  const scrollRef = useRef<ScrollView>(null);
  const nameInputRef = useRef<RNTextInput>(null);
  // Names created with "Save and add another" while this form stayed open.
  const [createdNames, setCreatedNames] = useState<string[]>([]);
  const [isAddingAnother, setIsAddingAnother] = useState(false);
  // Once the user picks an area, stop replacing it with the suggested one.
  const areaChosenRef = useRef(isEditing || !!params.productionAreaId);

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
    reset,
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
      pricingMode: initialOptions.length > 0 ? "variants" : "unique",
      options: initialOptions,
    },
  });

  const { fields, append, replace, update } = useFieldArray({
    control,
    name: "options",
  });
  const pricingMode = useWatch({ control, name: "pricingMode" });
  const categoryId = useWatch({ control, name: "categoryId" });

  useEffect(() => {
    if (areaChosenRef.current) return;
    setValue(
      "productionAreaId",
      getDefaultProductionAreaId(
        categoryId,
        products,
        productionAreas,
        lastProductionAreaId,
      ),
    );
    // Products change after every save; the suggestion only follows the
    // category and the list of areas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, productionAreas, setValue]);

  // Areas known when the user left to create one; the first area missing from
  // this set once they come back is the new one.
  const knownAreaIdsRef = useRef<Set<number> | null>(null);

  const handleCreateProductionArea = () => {
    knownAreaIdsRef.current = new Set(productionAreas.map((area) => area.id));
    router.push("/(profile)/production/areas/form");
  };

  useEffect(() => {
    const knownAreaIds = knownAreaIdsRef.current;
    if (!knownAreaIds) return;
    const createdArea = productionAreas.find(
      (area) => !knownAreaIds.has(area.id),
    );
    if (!createdArea) return;
    knownAreaIdsRef.current = null;
    areaChosenRef.current = true;
    setValue("productionAreaId", String(createdArea.id), {
      shouldValidate: true,
    });
  }, [productionAreas, setValue]);

  // Same for categories created from the category picker.
  const knownCategoryIdsRef = useRef<Set<string> | null>(null);

  const handleCreateCategory = () => {
    knownCategoryIdsRef.current = new Set(categories.map((c) => c.id));
    router.push("/(profile)/menu/categories/form");
  };

  useEffect(() => {
    const knownCategoryIds = knownCategoryIdsRef.current;
    if (!knownCategoryIds) return;
    const createdCategory = categories.find(
      (category) => !knownCategoryIds.has(category.id),
    );
    if (!createdCategory) return;
    knownCategoryIdsRef.current = null;
    setValue("categoryId", createdCategory.id, { shouldValidate: true });
  }, [categories, setValue]);

  const animateLayout = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const handleRemoveVariant = (index: number) => {
    animateLayout();
    const remaining = fields
      .filter((_, idx) => idx !== index)
      .map(({ name, price, isDefault }) => ({ name, price, isDefault }));
    // A product with variants always keeps one default.
    if (remaining.length > 0 && !remaining.some((v) => v.isDefault)) {
      remaining[0].isDefault = true;
    }
    replace(remaining);
  };

  const handleMakeDefault = (index: number) => {
    fields.forEach((field, idx) => {
      if (field.isDefault !== (idx === index)) {
        update(idx, { ...field, isDefault: idx === index });
      }
    });
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
      // The default is changed from the row's star, not from this sheet.
      update(editingVariantIndex, {
        name: trimmedName,
        price: variantDraft.price,
        isDefault: fields[editingVariantIndex].isDefault,
      });
    }

    closeVariantSheet();
  };

  const handleCopyVariants = (options: VariantSetOption[]) => {
    animateLayout();
    setValue("pricingMode", "variants");
    replace(
      options.map((option) => ({
        name: option.name,
        price: String(option.price),
        isDefault: option.isDefault,
      })),
    );
  };

  const onSubmit = async (data: ProductFormData, addAnother = false) => {
    const hasVariants =
      data.pricingMode === "variants" && data.options.length > 0;

    const payload = {
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      price: Number(data.price),
      categoryId: data.categoryId,
      productionAreaId: Number(data.productionAreaId),
      hasVariants,
      trackStock: hasVariants ? undefined : false,
      quantity: hasVariants ? undefined : 0,
      productOptions: hasVariants
        ? data.options.map((opt) => ({
            name: opt.name.trim(),
            price: Number(opt.price) || 0,
            isDefault: opt.isDefault,
            trackStock: false,
          }))
        : [],
    };

    if (isEditing) {
      await updateProduct.mutateAsync({
        ...payload,
        id: params.productId!,
        isPublic: data.isPublic,
      });
    } else {
      await createProduct.mutateAsync(payload);
      setLastProductionAreaId(payload.productionAreaId);
    }

    if (addAnother) {
      // Keep category, area, price type and variants for the next product.
      setCreatedNames((names) => [...names, payload.name]);
      reset({
        ...data,
        name: "",
        description: "",
        price: data.pricingMode === "unique" ? "" : data.price,
      });
      return;
    }

    router.back();
  };

  // After "Save and add another", go back to the top, ready for the next name.
  useEffect(() => {
    if (createdNames.length === 0) return;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    nameInputRef.current?.focus();
  }, [createdNames]);

  const handleCreateAndAddAnother = async () => {
    setIsAddingAnother(true);
    try {
      await handleSubmit((data) => onSubmit(data, true))();
    } finally {
      setIsAddingAnother(false);
    }
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
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`${!isEditing ? "pb-32" : "pb-8"}`}
        >
          <ThemedView style={tw`items-center gap-2 flex-row justify-between`}>
            <ThemedView style={tw`items-center gap-4 flex-row`}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => tw.style(pressed && "opacity-70")}
              >
                <Icon
                  name="arrow-left"
                  color={tw.color("on-surface")}
                  size={24}
                />
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
                onPress={handleSubmit((data) => onSubmit(data))}
                loading={isSubmitting || updateProduct.isPending}
                disabled={isSubmitting || updateProduct.isPending}
              />
            )}
          </ThemedView>

          <ThemedView style={tw`my-6`} />

          {createdNames.length > 0 && (
            <ThemedView style={tw`flex-row items-center gap-2 mb-4 px-2`}>
              <Icon
                name="circle-check"
                size={18}
                color={tw.color("gray-500")}
              />
              <ThemedText type="body2" style={tw`flex-1 text-gray-500`}>
                {t("products.createdList", {
                  names: createdNames.join(", "),
                })}
              </ThemedText>
            </ThemedView>
          )}

          <ThemedView style={tw`gap-6`}>
            <ThemedView style={tw`gap-4`}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    ref={nameInputRef}
                    label={t("products.fields.name")}
                    icon="hamburger"
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
                    icon="file-text"
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
            </ThemedView>

            {!isEditing && <Separator />}

            {!isEditing && (
              <ThemedView style={tw`gap-4`}>
                {!hasPresetCategory &&
                  (categories.length === 0 ? (
                    <ThemedView
                      style={tw`items-center py-6 gap-2 bg-surface-high rounded-3xl px-4`}
                    >
                      <Icon name="tag" size={32} color={tw.color("gray-400")} />
                      <ThemedText type="body2" style={tw`font-semibold`}>
                        {t("products.noCategoriesAvailable")}
                      </ThemedText>
                      <ThemedText
                        type="small"
                        style={tw`text-center text-gray-500`}
                      >
                        {t("products.noCategoriesAvailableDescription")}
                      </ThemedText>
                      <Button
                        leftIcon="plus"
                        label={t("categories.newCategory")}
                        variant="outline"
                        onPress={handleCreateCategory}
                        style={tw`mt-2`}
                      />
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
                          headerAction={{
                            label: t("categories.newCategory"),
                            onPress: handleCreateCategory,
                          }}
                        />
                      )}
                    />
                  ))}
                {!hasPresetCategory && errors.categoryId && (
                  <ThemedText type="small" style={tw`text-red-500 -mt-2 ml-2`}>
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
                      onChange={(v) => {
                        areaChosenRef.current = true;
                        onChange(String(v));
                      }}
                      headerAction={{
                        label: t("productionAreas:newArea"),
                        onPress: handleCreateProductionArea,
                      }}
                    />
                  )}
                />
                {errors.productionAreaId && (
                  <ThemedText type="small" style={tw`text-red-500 -mt-2 ml-2`}>
                    {errors.productionAreaId.message}
                  </ThemedText>
                )}
              </ThemedView>
            )}

            {!isEditing && <Separator />}

            {!isEditing && (
              <ThemedView style={tw`gap-4`}>
                <ThemedView style={tw`gap-2`}>
                  <ThemedText type="small" style={tw`ml-2`}>
                    {t("products.fields.pricingMode")}
                  </ThemedText>
                  <Controller
                    control={control}
                    name="pricingMode"
                    render={({ field: { value, onChange } }) => (
                      <ButtonGroup
                        options={pricingModeOptions}
                        selected={value}
                        onChange={(mode) => {
                          animateLayout();
                          onChange(mode);
                        }}
                      />
                    )}
                  />
                </ThemedView>

                {pricingMode === "unique" ? (
                  <Controller
                    control={control}
                    name="price"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        label={t("products.fields.price")}
                        icon="tag"
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
                  <ThemedView style={tw`gap-3`}>
                    {fields.length === 0 ? (
                      <ThemedView
                        style={tw`items-center py-6 gap-2 bg-surface-high rounded-3xl px-4`}
                      >
                        <Icon
                          name="sliders-horizontal"
                          size={28}
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
                      <ThemedView>
                        {fields.map((field, index) => (
                          <SwipeableRow
                            key={field.id}
                            onDelete={() => handleRemoveVariant(index)}
                          >
                            <ThemedView
                              style={tw`flex-row items-center gap-1 bg-background`}
                            >
                              <Pressable
                                onPress={() => handleMakeDefault(index)}
                                disabled={field.isDefault}
                                hitSlop={6}
                                accessibilityRole="button"
                                accessibilityLabel={
                                  field.isDefault
                                    ? t("products.variants.fields.isDefault")
                                    : t("products.variants.makeDefault")
                                }
                                accessibilityState={{
                                  selected: field.isDefault,
                                }}
                                style={({ pressed }) =>
                                  tw.style(
                                    "p-2.5 -ml-2.5",
                                    pressed && "opacity-60",
                                  )
                                }
                              >
                                <Icon
                                  name={field.isDefault ? "star" : "star"}
                                  size={22}
                                  color={tw.color("gray-400")}
                                />
                              </Pressable>
                              <Pressable
                                onPress={() => openEditVariant(index)}
                                style={({ pressed }) =>
                                  tw.style(
                                    "flex-1 flex-row items-center justify-between gap-4 py-3",
                                    pressed && "opacity-60",
                                  )
                                }
                              >
                                <ThemedText
                                  type="body1"
                                  style={[
                                    tw`flex-1`,
                                    { fontFamily: typography.semibold },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {field.name ||
                                    t("products.variants.variantNumber", {
                                      number: index + 1,
                                    })}
                                </ThemedText>
                                <ThemedText
                                  type="body1"
                                  style={{ fontFamily: typography.regular }}
                                >
                                  {formatCurrency(Number(field.price) || 0)}
                                </ThemedText>
                              </Pressable>
                            </ThemedView>
                          </SwipeableRow>
                        ))}
                      </ThemedView>
                    )}

                    <Button
                      label={t("products.variants.addVariant")}
                      leftIcon="plus"
                      variant="outline"
                      onPress={openAddVariant}
                      size="small"
                    />

                    <Button
                      label={t("products.variants.copy.button")}
                      leftIcon="copy"
                      variant="text"
                      onPress={() => copyVariantsSheetRef.current?.present()}
                      size="small"
                    />
                  </ThemedView>
                )}
              </ThemedView>
            )}
          </ThemedView>
        </ScrollView>
      </ScreenLayout>

      {!isEditing && (
        <ThemedView
          style={tw`absolute bottom-0 left-0 right-0 bg-background  px-4 py-4`}
        >
          <ThemedView style={tw`flex-row justify-end gap-3`}>
            <Button
              label={t("products.saveAndAddAnother")}
              variant="outline"
              onPress={handleCreateAndAddAnother}
              loading={isAddingAnother}
              disabled={isCreateDisabled}
            />
            <Button
              label={t("products.create")}
              onPress={handleSubmit((data) => onSubmit(data))}
              loading={
                !isAddingAnother && (isSubmitting || createProduct.isPending)
              }
              disabled={isCreateDisabled}
            />
          </ThemedView>
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

      {!isEditing && (
        <CopyVariantsSheet
          sheetRef={copyVariantsSheetRef}
          products={products}
          onSelect={handleCopyVariants}
        />
      )}

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

          {editingVariantIndex === null && fields.length > 0 && (
            <Checkbox
              label={t("products.variants.fields.isDefault")}
              value={variantDraft.isDefault}
              onValueChange={(v) =>
                setVariantDraft((draft) => ({ ...draft, isDefault: v }))
              }
              size="small"
            />
          )}

          <Button
            label={t("confirm")}
            onPress={handleSaveVariant}
            disabled={!variantDraft.name.trim()}
            style={tw`mt-2`}
          />
        </BottomSheetView>
      </ThemedBottomSheetModal>
    </KeyboardAvoidingView>
  );
}
