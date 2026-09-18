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
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const buildSetCredentialsSchema = (t: (key: string) => string) =>
  z
    .object({
      username: z.string().min(2, t("account.validations.usernameMinLength")),
      password: z
        .string()
        .regex(PASSWORD_PATTERN, t("account.validations.securePasswordPattern")),
      confirmPassword: z
        .string()
        .min(1, t("account.validations.confirmPasswordRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("account.validations.passwordsDoNotMatch"),
      path: ["confirmPassword"],
    });

type SetCredentialsFormData = z.infer<
  ReturnType<typeof buildSetCredentialsSchema>
>;

export default function SetCredentialsScreen() {
  const { t } = useTranslation("auth");
  const { user, setCredentials } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = buildSetCredentialsSchema(t);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SetCredentialsFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: user?.username || "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SetCredentialsFormData) => {
    setIsSubmitting(true);
    const { success, errorCode } = await setCredentials(
      data.username.trim(),
      data.password,
    );
    setIsSubmitting(false);

    if (success) {
      toast.success(t("account.setCredentialsSuccess"));
      router.back();
      return;
    }

    if (errorCode === "USERNAME_TAKEN") {
      toast.error(t("account.validations.usernameTaken"));
      return;
    }

    toast.error(t("account.setCredentialsError"));
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
                {t("account.setCredentialsTitle")}
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
            {t("account.setCredentialsSubtitle")}
          </ThemedText>

          <ThemedView style={tw`gap-4`}>
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("account.username")}
                  autoCapitalize="none"
                  icon="person-outline"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={errors.username?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("account.newPassword")}
                  autoCapitalize="none"
                  secureTextEntry={!showPassword}
                  icon="lock-closed-outline"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={errors.password?.message}
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
