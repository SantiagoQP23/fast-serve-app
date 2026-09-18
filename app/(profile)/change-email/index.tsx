import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { toast } from "sonner-native";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import PasswordVisibilityToggle from "@/presentation/auth/components/password-visibility-toggle";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";

const buildChangeEmailSchema = (
  t: (key: string) => string,
  hasLocalPassword: boolean,
) =>
  z.object({
    newEmail: z
      .string()
      .min(1, t("account.validations.newEmailRequired"))
      .email(t("account.validations.invalidEmail")),
    currentPassword: hasLocalPassword
      ? z.string().min(1, t("account.validations.currentPasswordRequired"))
      : z.string().optional(),
  });

type ChangeEmailFormData = z.infer<ReturnType<typeof buildChangeEmailSchema>>;

export default function ChangeEmailScreen() {
  const { t } = useTranslation(["auth", "errors"]);
  const { user, changeEmail } = useAuthStore();

  const hasLocalPassword = user?.authProvider?.includes("local") ?? true;

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = buildChangeEmailSchema(t, hasLocalPassword);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangeEmailFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      newEmail: "",
      currentPassword: "",
    },
  });

  const onSubmit = async (data: ChangeEmailFormData) => {
    setIsSubmitting(true);
    const { success, errorCode } = await changeEmail(
      data.newEmail.trim(),
      data.currentPassword,
    );
    setIsSubmitting(false);

    if (success) {
      toast.success(t("account.changeEmailSuccess"));
      router.back();
      return;
    }

    if (errorCode === "EMAIL_ALREADY_REGISTERED") {
      toast.error(t("errors:auth.emailAlreadyRegistered"));
      return;
    }

    if (errorCode === "INVALID_CURRENT_PASSWORD") {
      toast.error(t("account.validations.currentPasswordInvalid"));
      return;
    }

    toast.error(t("account.changeEmailError"));
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
                {t("account.changeEmailTitle")}
              </ThemedText>
            </ThemedView>
            <Button
              label={t("account.save")}
              size="small"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting}
            />
          </ThemedView>

          <ThemedView style={tw`my-6`} />

          <ThemedText style={tw`text-gray-600 mb-4`}>
            {hasLocalPassword
              ? t("account.changeEmailSubtitle")
              : t("account.changeEmailGoogleSubtitle")}
          </ThemedText>

          <ThemedView style={tw`gap-4`}>
            <TextInput
              label={t("account.currentEmail")}
              value={user?.email}
              editable={false}
              icon="mail-outline"
            />

            <Controller
              control={control}
              name="newEmail"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("account.newEmail")}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  icon="mail-outline"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={errors.newEmail?.message}
                />
              )}
            />

            {hasLocalPassword && (
              <Controller
                control={control}
                name="currentPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label={t("account.currentPassword")}
                    autoCapitalize="none"
                    secureTextEntry={!showPassword}
                    icon="lock-closed-outline"
                    onBlur={onBlur}
                    value={value}
                    onChangeText={onChange}
                    error={errors.currentPassword?.message}
                    leftIcon={
                      value && (
                        <PasswordVisibilityToggle
                          visible={showPassword}
                          onToggle={() => setShowPassword((prev) => !prev)}
                        />
                      )
                    }
                  />
                )}
              />
            )}
          </ThemedView>
        </ScrollView>
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}
