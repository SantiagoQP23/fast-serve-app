import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { getPaymentMethodTranslationKey } from "@/core/i18n/utils";
import { usePaymentMethods } from "@/presentation/restaurant/hooks/usePaymentMethods";
import { usePaymentMethodsManagement } from "@/presentation/restaurant/hooks/usePaymentMethodsManagement";
import { PaymentMethodCategory } from "@/core/restaurant/models/payment-method.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import Select from "@/presentation/theme/components/select";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";

const selectableCategories = [
  PaymentMethodCategory.CASH,
  PaymentMethodCategory.CARD,
  PaymentMethodCategory.TRANSFER,
];

const buildEditPaymentMethodSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t("methods.validations.nameRequired")),
    type: z.nativeEnum(PaymentMethodCategory, {
      message: t("methods.validations.categoryRequired"),
    }),
  });

type PaymentMethodEditFormData = z.infer<
  ReturnType<typeof buildEditPaymentMethodSchema>
>;

export default function PaymentMethodEditScreen() {
  const { t } = useTranslation("paymentMethods");
  const params = useLocalSearchParams<{ methodId: string }>();
  const { paymentMethods } = usePaymentMethods();
  const { updatePaymentMethod } = usePaymentMethodsManagement();

  const method = paymentMethods.find((m) => String(m.id) === params.methodId);

  const schema = buildEditPaymentMethodSchema(t);

  // Multiple CARD payment methods are allowed (e.g. different processors),
  // so CARD never counts as "already configured" by another method; every
  // other category stays available only to the method that already owns it.
  const usedCategories = new Set(
    paymentMethods
      .filter((candidate) => candidate.id !== method?.id)
      .filter((candidate) => candidate.type !== PaymentMethodCategory.CARD)
      .map((candidate) => candidate.type),
  );

  const categoryOptions = selectableCategories
    .filter((value) => !usedCategories.has(value) || value === method?.type)
    .map((value) => ({
      label: t(getPaymentMethodTranslationKey(value)),
      value,
    }));

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<PaymentMethodEditFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: method?.name ?? "",
      type: method?.type ?? PaymentMethodCategory.CASH,
    },
  });

  const typeValue = watch("type");

  // Default the name to the selected category, as long as the user hasn't
  // typed a custom name of their own.
  const previousTypeRef = useRef(typeValue);
  useEffect(() => {
    if (typeValue === previousTypeRef.current) return;
    previousTypeRef.current = typeValue;
    if (!dirtyFields.name) {
      setValue("name", t(getPaymentMethodTranslationKey(typeValue)));
    }
  }, [typeValue, dirtyFields.name, setValue, t]);

  const onSubmit = async (data: PaymentMethodEditFormData) => {
    if (!method) return;
    await updatePaymentMethod.mutateAsync({
      id: method.id,
      data: { name: data.name.trim(), type: data.type },
    });
    router.back();
  };

  if (!method) {
    return (
      <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
        <ThemedView style={tw`items-center gap-4 flex-row`}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => tw.style(pressed && "opacity-70")}
          >
            <Ionicons name="arrow-back-outline" size={24} />
          </Pressable>
        </ThemedView>
        <ThemedView style={tw`items-center py-8 gap-3`}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <ThemedText type="body1" style={tw`text-gray-500`}>
            {t("methods.notFound")}
          </ThemedText>
          <Button
            label={t("common:actions.goBack")}
            leftIcon="arrow-back-outline"
            variant="outline"
            onPress={() => router.back()}
          />
        </ThemedView>
      </ScreenLayout>
    );
  }

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
                {t("methods.editMethod")}
              </ThemedText>
            </ThemedView>
            <Button
              label={t("methods.save")}
              size="small"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting || updatePaymentMethod.isPending}
              disabled={isSubmitting || updatePaymentMethod.isPending}
            />
          </ThemedView>

          <ThemedView style={tw`my-6`} />

          <ThemedView style={tw`gap-4`}>
            <Controller
              control={control}
              name="type"
              render={({ field: { value, onChange } }) => (
                <Select
                  label={t("methods.fields.category")}
                  options={categoryOptions}
                  value={value}
                  onChange={(v) => onChange(v as PaymentMethodCategory)}
                  placeholder={t("methods.placeholders.category")}
                />
              )}
            />

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("methods.fields.name")}
                  icon="card-outline"
                  placeholder={t("methods.placeholders.name")}
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
