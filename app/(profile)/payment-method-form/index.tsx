import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyboardAvoidingView, Pressable, ScrollView, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { getPaymentMethodTranslationKey } from "@/core/i18n/utils";
import { useAccounts } from "@/presentation/restaurant/hooks/useAccounts";
import { usePaymentMethodsManagement } from "@/presentation/restaurant/hooks/usePaymentMethodsManagement";
import { PaymentMethodCategory } from "@/core/restaurant/models/payment-method.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import Checkbox from "@/presentation/theme/components/checkbox";
import Select from "@/presentation/theme/components/select";
import IconButton from "@/presentation/theme/components/icon-button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import tw from "@/presentation/theme/lib/tailwind";

const buildPaymentMethodSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t("methods.validations.nameRequired")),
    type: z.nativeEnum(PaymentMethodCategory, {
      message: t("methods.validations.categoryRequired"),
    }),
    commissionPercentage: z
      .string()
      .refine(
        (v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0),
        t("methods.validations.commissionInvalid"),
      ),
    allowedDestinationAccountIds: z
      .array(z.string())
      .min(1, t("methods.validations.allowedAccountsRequired")),
    defaultDestinationAccountId: z
      .string()
      .min(1, t("methods.validations.defaultAccountRequired")),
    isActive: z.boolean(),
  });

type PaymentMethodFormData = z.infer<
  ReturnType<typeof buildPaymentMethodSchema>
>;

export default function PaymentMethodFormScreen() {
  const { t } = useTranslation("paymentMethods");
  const params = useLocalSearchParams<{
    methodId?: string;
    name?: string;
    type?: string;
    commissionPercentage?: string;
    allowedDestinationAccountIds?: string;
    defaultDestinationAccountId?: string;
    isActive?: string;
  }>();

  const isEditing = !!params.methodId;

  const { accounts } = useAccounts();
  const { createPaymentMethod, updatePaymentMethod, deletePaymentMethod } =
    usePaymentMethodsManagement();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const schema = buildPaymentMethodSchema(t);

  const initialAllowedIds = params.allowedDestinationAccountIds
    ? params.allowedDestinationAccountIds.split(",").filter(Boolean)
    : [];

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PaymentMethodFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: params.name || "",
      type: (params.type as PaymentMethodCategory) || PaymentMethodCategory.CASH,
      commissionPercentage: params.commissionPercentage || "0",
      allowedDestinationAccountIds: initialAllowedIds,
      defaultDestinationAccountId: params.defaultDestinationAccountId || "",
      isActive: params.isActive !== "false",
    },
  });

  const allowedIds = watch("allowedDestinationAccountIds");
  const defaultId = watch("defaultDestinationAccountId");

  // Auto-clear the default account if it's no longer in the allowed list
  useEffect(() => {
    if (defaultId && !allowedIds.includes(defaultId)) {
      setValue("defaultDestinationAccountId", "");
    }
  }, [allowedIds, defaultId, setValue]);

  const onSubmit = async (data: PaymentMethodFormData) => {
    const payload = {
      name: data.name.trim(),
      type: data.type,
      commissionPercentage: data.commissionPercentage
        ? Number(data.commissionPercentage)
        : 0,
      allowedDestinationAccountIds: data.allowedDestinationAccountIds.map(Number),
      defaultDestinationAccountId: Number(data.defaultDestinationAccountId),
    };

    if (isEditing) {
      await updatePaymentMethod.mutateAsync({
        id: Number(params.methodId),
        data: { ...payload, isActive: data.isActive },
      });
    } else {
      await createPaymentMethod.mutateAsync(payload);
    }

    router.back();
  };

  const handleConfirmDelete = async () => {
    if (!params.methodId) return;
    await deletePaymentMethod.mutateAsync(Number(params.methodId));
    setShowDeleteConfirm(false);
    router.back();
  };

  const toggleAccountId = (
    currentIds: string[],
    accountId: string,
    onChange: (value: string[]) => void,
  ) => {
    const nextIds = currentIds.includes(accountId)
      ? currentIds.filter((id) => id !== accountId)
      : [...currentIds, accountId];
    onChange(nextIds);
  };

  const categoryOptions = Object.values(PaymentMethodCategory).map(
    (value) => ({
      label: t(getPaymentMethodTranslationKey(value)),
      value,
    }),
  );

  const defaultAccountOptions = accounts
    .filter((account) => allowedIds.includes(String(account.id)))
    .map((account) => ({ label: account.name, value: String(account.id) }));

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
                  ? t("methods.editMethod")
                  : t("methods.createMethod")}
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

            <Controller
              control={control}
              name="commissionPercentage"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("methods.fields.commission")}
                  icon="pricetag-outline"
                  placeholder={t("methods.placeholders.commission")}
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  keyboardType="decimal-pad"
                  error={errors.commissionPercentage?.message}
                />
              )}
            />

            {accounts.length === 0 ? (
              <ThemedView
                style={tw`items-center py-6 gap-2 bg-gray-50 dark:bg-gray-800 rounded-3xl px-4`}
              >
                <Ionicons
                  name="wallet-outline"
                  size={32}
                  color={tw.color("gray-400")}
                />
                <ThemedText type="body2" style={tw`font-semibold`}>
                  {t("methods.noAccountsAvailable")}
                </ThemedText>
                <ThemedText type="small" style={tw`text-center text-gray-500`}>
                  {t("methods.noAccountsAvailableDescription")}
                </ThemedText>
              </ThemedView>
            ) : (
              <ThemedView style={tw`gap-3`}>
                <ThemedText type="body1" style={tw`font-semibold`}>
                  {t("methods.fields.allowedAccounts")}
                </ThemedText>
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {t("methods.fields.allowedAccountsDescription")}
                </ThemedText>
                <Controller
                  control={control}
                  name="allowedDestinationAccountIds"
                  render={({ field: { value, onChange } }) => (
                    <ThemedView style={tw`gap-3`}>
                      {accounts.map((account) => (
                        <Checkbox
                          key={account.id}
                          label={account.name}
                          value={value.includes(String(account.id))}
                          onValueChange={() =>
                            toggleAccountId(value, String(account.id), onChange)
                          }
                        />
                      ))}
                    </ThemedView>
                  )}
                />
                {errors.allowedDestinationAccountIds && (
                  <ThemedText type="small" style={tw`text-red-500 ml-2`}>
                    {errors.allowedDestinationAccountIds.message}
                  </ThemedText>
                )}
              </ThemedView>
            )}

            {allowedIds.length > 0 && (
              <>
                <Controller
                  control={control}
                  name="defaultDestinationAccountId"
                  render={({ field: { value, onChange } }) => (
                    <Select
                      label={t("methods.fields.defaultAccount")}
                      options={defaultAccountOptions}
                      value={value}
                      onChange={(v) => onChange(String(v))}
                      placeholder={t("methods.placeholders.defaultAccount")}
                    />
                  )}
                />
                {errors.defaultDestinationAccountId && (
                  <ThemedText type="small" style={tw`text-red-500 -mt-2 ml-2`}>
                    {errors.defaultDestinationAccountId.message}
                  </ThemedText>
                )}
              </>
            )}

            {isEditing && (
              <ThemedView style={tw`gap-3 mt-2`}>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field: { value, onChange } }) => (
                    <Checkbox
                      label={t("methods.fields.isActive")}
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
              isEditing ? t("methods.saveMethod") : t("methods.createMethod")
            }
            onPress={handleSubmit(onSubmit)}
            loading={
              isSubmitting ||
              createPaymentMethod.isPending ||
              updatePaymentMethod.isPending
            }
            disabled={
              isSubmitting ||
              createPaymentMethod.isPending ||
              updatePaymentMethod.isPending ||
              accounts.length === 0
            }
          />
        </ScrollView>
      </ScreenLayout>

      <DialogModal
        visible={showDeleteConfirm}
        title={t("methods.deleteTitle")}
        message={t("methods.deleteMessage")}
        confirmText={t("confirm")}
        cancelText={t("cancel")}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </KeyboardAvoidingView>
  );
}
