import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyboardAvoidingView, Pressable, ScrollView, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useAccountsManagement } from "@/presentation/restaurant/hooks/useAccountsManagement";
import { AccountType } from "@/core/restaurant/models/account.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import Checkbox from "@/presentation/theme/components/checkbox";
import Select from "@/presentation/theme/components/select";
import tw from "@/presentation/theme/lib/tailwind";

const buildAccountSchema = (t: (key: string) => string) =>
  z.object({
    name: z
      .string()
      .min(1, t("accounts.validations.nameRequired"))
      .max(60, t("accounts.validations.nameMaxLength")),
    description: z.string().optional(),
    num: z.string().optional(),
    type: z.nativeEnum(AccountType, {
      message: t("accounts.validations.typeRequired"),
    }),
    isActive: z.boolean(),
  });

type AccountFormData = z.infer<ReturnType<typeof buildAccountSchema>>;

export default function AccountFormScreen() {
  const { t } = useTranslation("paymentMethods");
  const params = useLocalSearchParams<{
    accountId?: string;
    name?: string;
    description?: string;
    num?: string;
    type?: string;
    isActive?: string;
  }>();

  const isEditing = !!params.accountId;

  const { createAccount, updateAccount } = useAccountsManagement();

  const schema = buildAccountSchema(t);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: params.name || "",
      description: params.description || "",
      num: params.num || "",
      type: (params.type as AccountType) || AccountType.CASH,
      isActive: params.isActive !== "false",
    },
  });

  const onSubmit = async (data: AccountFormData) => {
    if (isEditing) {
      await updateAccount.mutateAsync({
        id: Number(params.accountId),
        data: {
          name: data.name.trim(),
          description: data.description?.trim() || "",
          num: data.num?.trim() || undefined,
          type: data.type,
          isActive: data.isActive,
        },
      });
    } else {
      await createAccount.mutateAsync({
        name: data.name.trim(),
        description: data.description?.trim() || "",
        num: data.num?.trim() || undefined,
        type: data.type,
      });
    }

    router.back();
  };

  const typeOptions = Object.values(AccountType).map((value) => ({
    label: t(`accounts.types.${value}`),
    value,
  }));

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
          <ThemedView style={tw`items-center gap-2 flex-row`}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => tw.style(pressed && "opacity-70")}
            >
              <Ionicons name="arrow-back-outline" size={24} />
            </Pressable>
            <ThemedText type="h2">
              {isEditing ? t("accounts.editAccount") : t("accounts.createAccount")}
            </ThemedText>
          </ThemedView>

          <ThemedView style={tw`my-6`} />

          <ThemedView style={tw`gap-4`}>
            <Controller
              control={control}
              name="type"
              render={({ field: { value, onChange } }) => (
                <Select
                  label={t("accounts.fields.type")}
                  options={typeOptions}
                  value={value}
                  onChange={(v) => onChange(v as AccountType)}
                  placeholder={t("accounts.placeholders.type")}
                />
              )}
            />

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("accounts.fields.name")}
                  icon="wallet-outline"
                  placeholder={t("accounts.placeholders.name")}
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
                  label={t("accounts.fields.description")}
                  icon="document-text-outline"
                  placeholder={t("accounts.placeholders.description")}
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />

            <Controller
              control={control}
              name="num"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("accounts.fields.num")}
                  icon="keypad-outline"
                  placeholder={t("accounts.placeholders.num")}
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />

            {isEditing && (
              <ThemedView style={tw`gap-3 mt-2`}>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field: { value, onChange } }) => (
                    <Checkbox
                      label={t("accounts.fields.isActive")}
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
              isEditing ? t("accounts.saveAccount") : t("accounts.createAccount")
            }
            onPress={handleSubmit(onSubmit)}
            loading={
              isSubmitting || createAccount.isPending || updateAccount.isPending
            }
            disabled={
              isSubmitting || createAccount.isPending || updateAccount.isPending
            }
          />
        </ScrollView>
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}
