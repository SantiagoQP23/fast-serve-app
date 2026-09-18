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

const PASSWORD_PATTERN =
  /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;

const buildChangePasswordSchema = (t: (key: string) => string) =>
  z
    .object({
      currentPassword: z
        .string()
        .min(1, t("account.validations.currentPasswordRequired")),
      newPassword: z
        .string()
        .min(6, t("account.validations.passwordMinLength"))
        .max(50, t("account.validations.passwordMaxLength"))
        .regex(PASSWORD_PATTERN, t("account.validations.passwordPattern")),
      confirmPassword: z
        .string()
        .min(1, t("account.validations.confirmPasswordRequired")),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("account.validations.passwordsDoNotMatch"),
      path: ["confirmPassword"],
    });

type ChangePasswordFormData = z.infer<
  ReturnType<typeof buildChangePasswordSchema>
>;

export default function ChangePasswordScreen() {
  const { t } = useTranslation("auth");
  const { changePassword } = useAuthStore();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = buildChangePasswordSchema(t);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsSubmitting(true);
    const { success, errorCode } = await changePassword(
      data.currentPassword,
      data.newPassword,
    );
    setIsSubmitting(false);

    if (success) {
      toast.success(t("account.changePasswordSuccess"));
      router.back();
      return;
    }

    if (errorCode === "INVALID_CURRENT_PASSWORD") {
      toast.error(t("account.validations.currentPasswordInvalid"));
      return;
    }

    toast.error(t("account.changePasswordError"));
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
                {t("account.changePasswordTitle")}
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

          <ThemedView style={tw`gap-4`}>
            <Controller
              control={control}
              name="currentPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("account.currentPassword")}
                  autoCapitalize="none"
                  secureTextEntry={!showCurrentPassword}
                  icon="lock-closed-outline"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={errors.currentPassword?.message}
                  leftIcon={
                    value && (
                      <PasswordVisibilityToggle
                        visible={showCurrentPassword}
                        onToggle={() =>
                          setShowCurrentPassword((prev) => !prev)
                        }
                      />
                    )
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="newPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("account.newPassword")}
                  autoCapitalize="none"
                  secureTextEntry={!showNewPassword}
                  icon="lock-closed-outline"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={errors.newPassword?.message}
                  leftIcon={
                    value && (
                      <PasswordVisibilityToggle
                        visible={showNewPassword}
                        onToggle={() => setShowNewPassword((prev) => !prev)}
                      />
                    )
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("account.confirmNewPassword")}
                  autoCapitalize="none"
                  secureTextEntry={!showConfirmPassword}
                  icon="lock-closed-outline"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={errors.confirmPassword?.message}
                  leftIcon={
                    value && (
                      <PasswordVisibilityToggle
                        visible={showConfirmPassword}
                        onToggle={() =>
                          setShowConfirmPassword((prev) => !prev)
                        }
                      />
                    )
                  }
                />
              )}
            />
          </ThemedView>
        </ScrollView>
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}
