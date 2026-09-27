import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { getPaymentMethodTranslationKey } from "@/core/i18n/utils";
import { useAccounts } from "@/presentation/restaurant/hooks/useAccounts";
import { useAccountsManagement } from "@/presentation/restaurant/hooks/useAccountsManagement";
import { usePaymentMethods } from "@/presentation/restaurant/hooks/usePaymentMethods";
import { usePaymentMethodsManagement } from "@/presentation/restaurant/hooks/usePaymentMethodsManagement";
import { PaymentMethodCategory } from "@/core/restaurant/models/payment-method.model";
import { AccountType } from "@/core/restaurant/models/account.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import Checkbox from "@/presentation/theme/components/checkbox";
import Switch from "@/presentation/theme/components/switch";
import Select from "@/presentation/theme/components/select";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const { createAccount } = useAccountsManagement();
  const { paymentMethods } = usePaymentMethods();
  const { createPaymentMethod, updatePaymentMethod, deletePaymentMethod } =
    usePaymentMethodsManagement();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] = useState<AccountType>(
    AccountType.CASH,
  );
  const [newAccountDescription, setNewAccountDescription] = useState("");
  const [newAccountNum, setNewAccountNum] = useState("");
  const [newAccountError, setNewAccountError] = useState("");
  const newAccountSheetRef = useRef<BottomSheetMethods>(null);

  const schema = buildPaymentMethodSchema(t);

  const initialAllowedIds = params.allowedDestinationAccountIds
    ? params.allowedDestinationAccountIds.split(",").filter(Boolean)
    : [];

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
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
  const typeValue = watch("type");
  const isCardType = typeValue === PaymentMethodCategory.CARD;

  // Auto-clear the default account if it's no longer in the allowed list
  useEffect(() => {
    if (defaultId && !allowedIds.includes(defaultId)) {
      setValue("defaultDestinationAccountId", "");
    }
  }, [allowedIds, defaultId, setValue]);

  const animateLayout = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const onSubmit = async (data: PaymentMethodFormData) => {
    const payload = {
      name: data.name.trim(),
      type: data.type,
      commissionPercentage:
        data.type === PaymentMethodCategory.CARD && data.commissionPercentage
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

  const handleNext = async () => {
    const valid = await trigger(["type", "name", "commissionPercentage"]);
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

  const openAddAccountSheet = () => {
    setNewAccountName("");
    setNewAccountType(AccountType.CASH);
    setNewAccountDescription("");
    setNewAccountNum("");
    setNewAccountError("");
    newAccountSheetRef.current?.present();
  };

  const closeAddAccountSheet = () => {
    newAccountSheetRef.current?.dismiss();
  };

  const handleCreateAccountInline = async () => {
    const trimmedName = newAccountName.trim();
    if (!trimmedName) {
      setNewAccountError(t("accounts.validations.nameRequired"));
      return;
    }
    setNewAccountError("");

    const account = await createAccount.mutateAsync({
      name: trimmedName,
      description: newAccountDescription.trim() || "",
      num: newAccountNum.trim() || undefined,
      type: newAccountType,
    });

    const accountId = String(account.id);
    setValue("allowedDestinationAccountIds", [...allowedIds, accountId]);
    if (!defaultId) {
      setValue("defaultDestinationAccountId", accountId);
    }
    closeAddAccountSheet();
  };

  const selectableCategories = [
    PaymentMethodCategory.CASH,
    PaymentMethodCategory.CARD,
    PaymentMethodCategory.TRANSFER,
  ];

  const currentMethod = paymentMethods.find(
    (method) => String(method.id) === params.methodId,
  );

  // Multiple CARD payment methods are allowed (e.g. different processors),
  // so CARD never counts as "already configured".
  const usedCategories = new Set(
    paymentMethods
      .filter((method) => method.id !== currentMethod?.id)
      .filter((method) => method.type !== PaymentMethodCategory.CARD)
      .map((method) => method.type),
  );

  const categoryOptions = (
    currentMethod && !selectableCategories.includes(currentMethod.type)
      ? [...selectableCategories, currentMethod.type]
      : selectableCategories
  )
    .filter(
      (value) => !usedCategories.has(value) || value === currentMethod?.type,
    )
    .map((value) => ({
      label: t(getPaymentMethodTranslationKey(value)),
      value,
    }));

  const noCategoriesAvailable = !isEditing && categoryOptions.length === 0;

  const accountTypeOptions = Object.values(AccountType).map((value) => ({
    label: t(`accounts.types.${value}`),
    value,
  }));

  const defaultAccountOptions = accounts
    .filter((account) => allowedIds.includes(String(account.id)))
    .map((account) => ({ label: account.name, value: String(account.id) }));

  const isCreateDisabled =
    isSubmitting ||
    createPaymentMethod.isPending ||
    allowedIds.length === 0;

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
                  ? t("methods.editMethod")
                  : t("methods.createMethod")}
              </ThemedText>
            </ThemedView>
            {isEditing && (
              <Button
                label={t("methods.save")}
                size="small"
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting || updatePaymentMethod.isPending}
                disabled={isSubmitting || updatePaymentMethod.isPending}
              />
            )}
          </ThemedView>

          <ThemedView style={tw`my-6`} />

          {(isEditing || step === 1) && (
            <ThemedView style={tw`gap-4`}>
              {noCategoriesAvailable ? (
                <ThemedView
                  style={tw`items-center py-6 gap-2 bg-gray-50 dark:bg-gray-800 rounded-3xl px-4`}
                >
                  <Ionicons
                    name="checkmark-done-circle-outline"
                    size={32}
                    color={tw.color("gray-400")}
                  />
                  <ThemedText type="body2" style={tw`font-semibold`}>
                    {t("methods.allCategoriesConfigured")}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={tw`text-center text-gray-500`}
                  >
                    {t("methods.allCategoriesConfiguredDescription")}
                  </ThemedText>
                </ThemedView>
              ) : (
                <>
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

                  {isCardType && (
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
                  )}
                </>
              )}
            </ThemedView>
          )}

          {(isEditing || step === 2) && (
            <ThemedView style={tw`gap-4 ${isEditing ? "mt-2" : ""}`}>
              <ThemedView style={tw`gap-3`}>
                <ThemedView style={tw`flex-row items-center justify-between`}>
                  <ThemedView style={tw`gap-1 flex-1`}>
                    <ThemedText type="body1" style={tw`font-semibold`}>
                      {t("methods.fields.allowedAccounts")}
                    </ThemedText>
                    <ThemedText type="small" style={tw`text-gray-500`}>
                      {t("methods.fields.allowedAccountsDescription")}
                    </ThemedText>
                  </ThemedView>
                  <Button
                    label={t("methods.fields.addAccount")}
                    onPress={openAddAccountSheet}
                    variant="outline"
                    size="extra-small"
                    leftIcon="add-outline"
                  />
                </ThemedView>

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
                    <ThemedText
                      type="small"
                      style={tw`text-center text-gray-500`}
                    >
                      {t("methods.noAccountsAvailableDescription")}
                    </ThemedText>
                  </ThemedView>
                ) : (
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
                              toggleAccountId(
                                value,
                                String(account.id),
                                onChange,
                              )
                            }
                          />
                        ))}
                      </ThemedView>
                    )}
                  />
                )}
                {errors.allowedDestinationAccountIds && (
                  <ThemedText type="small" style={tw`text-red-500 ml-2`}>
                    {errors.allowedDestinationAccountIds.message}
                  </ThemedText>
                )}
              </ThemedView>

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
                    <ThemedText
                      type="small"
                      style={tw`text-red-500 -mt-2 ml-2`}
                    >
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
                      <Switch
                        label={t("methods.fields.isActive")}
                        value={value}
                        onValueChange={onChange}
                      />
                    )}
                  />
                </ThemedView>
              )}
            </ThemedView>
          )}
        </ScrollView>
      </ScreenLayout>

      {!isEditing && (
        <ThemedView
          style={tw`absolute bottom-0 left-0 right-0 bg-light-background dark:bg-black px-4 py-4`}
        >
          {step === 1 ? (
            <Button
              label={t("common:actions.next")}
              onPress={handleNext}
              disabled={noCategoriesAvailable}
            />
          ) : (
            <ThemedView style={tw`flex-row gap-3 justify-between`}>
              <Button
                label={t("common:actions.back")}
                onPress={handleBack}
                variant="text"
              />
              <Button
                label={t("methods.create")}
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting || createPaymentMethod.isPending}
                disabled={isCreateDisabled}
              />
            </ThemedView>
          )}
        </ThemedView>
      )}

      <DialogModal
        visible={showDeleteConfirm}
        title={t("methods.deleteTitle")}
        message={t("methods.deleteMessage")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ThemedBottomSheetModal ref={newAccountSheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
          <ThemedText type="h3">{t("accounts.createAccount")}</ThemedText>

          <Select
            label={t("accounts.fields.type")}
            options={accountTypeOptions}
            value={newAccountType}
            onChange={(v) => setNewAccountType(v as AccountType)}
            placeholder={t("accounts.placeholders.type")}
          />

          <TextInput
            bottomSheet
            label={t("accounts.fields.name")}
            placeholder={t("accounts.placeholders.name")}
            value={newAccountName}
            onChangeText={setNewAccountName}
          />

          <TextInput
            bottomSheet
            label={t("accounts.fields.description")}
            placeholder={t("accounts.placeholders.description")}
            value={newAccountDescription}
            onChangeText={setNewAccountDescription}
          />

          <TextInput
            bottomSheet
            label={t("accounts.fields.num")}
            placeholder={t("accounts.placeholders.num")}
            value={newAccountNum}
            onChangeText={setNewAccountNum}
          />

          {newAccountError ? (
            <ThemedText type="small" style={tw`text-red-500`}>
              {newAccountError}
            </ThemedText>
          ) : null}

          <Button
            label={t("accounts.create")}
            onPress={handleCreateAccountInline}
            loading={createAccount.isPending}
            disabled={createAccount.isPending}
          />
        </BottomSheetView>
      </ThemedBottomSheetModal>
    </KeyboardAvoidingView>
  );
}
