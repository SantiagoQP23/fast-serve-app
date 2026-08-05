import { KeyboardAvoidingView, ScrollView, Pressable, useWindowDimensions } from "react-native";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import Checkbox from "@/presentation/theme/components/checkbox";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { toast } from "sonner-native";

const signupSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "Los nombres deben tener al menos 2 caracteres"),
    lastName: z
      .string()
      .min(2, "Los apellidos deben tener al menos 2 caracteres"),
    username: z
      .string()
      .min(2, "El usuario debe tener al menos 2 caracteres"),
    numPhone: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => !val || /^\d{10}$/.test(val),
        "El celular debe tener 10 dígitos",
      ),
    email: z
      .string()
      .email("Ingresa un email válido"),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/,
        "Debe incluir mayúscula, minúscula, número y carácter especial",
      ),
    samePassword: z.string(),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "Debes aceptar los términos y condiciones",
    }),
  })
  .refine((data) => data.password === data.samePassword, {
    message: "Las contraseñas no coinciden",
    path: ["samePassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

const SignupScreen = () => {
  const { t } = useTranslation(["auth", "errors"]);
  const { height } = useWindowDimensions();
  const { register } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      numPhone: "",
      email: "",
      password: "",
      samePassword: "",
      termsAccepted: false,
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);

    const result = await register(
      data.firstName.trim(),
      data.lastName.trim(),
      data.username.trim(),
      data.email.trim(),
      data.password,
      data.numPhone?.trim() || undefined,
    );

    setIsSubmitting(false);

    if (result.success) {
      toast.success(t("auth:signup.successMessage"));
      router.replace("/no-restaurant");
      return;
    }

    if (result.errorCode === "EMAIL_ALREADY_REGISTERED") {
      toast.error(t("errors:auth.emailAlreadyRegistered"));
    } else {
      toast.error(t("auth:signup.errorMessage"));
    }
  };

  const handleGoToLogin = () => {
    router.push("/auth/login");
  };

  return (
    <KeyboardAvoidingView style={tw`flex-1`} behavior="padding">
      <ScreenLayout style={tw`px-4 gap-4`}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <ThemedView style={[{ paddingTop: height * 0.08, gap: 2 }]}>
            <ThemedText type="h1">{t("auth:signup.title")}</ThemedText>
            <ThemedText style={tw`text-gray-600`} type="body2">
              {t("auth:signup.subtitle")}
            </ThemedText>
          </ThemedView>

          <ThemedView style={tw`my-4`} />

          {/* Form */}
          <ThemedView style={tw`gap-4`}>
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("auth:signup.firstName")}
                  icon="person-outline"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={errors.firstName ? errors.firstName.message : undefined}
                />
              )}
            />

            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("auth:signup.lastName")}
                  icon="person-outline"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={errors.lastName ? errors.lastName.message : undefined}
                />
              )}
            />

            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("auth:signup.username")}
                  icon="at-outline"
                  autoCapitalize="none"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={errors.username ? errors.username.message : undefined}
                />
              )}
            />

            <Controller
              control={control}
              name="numPhone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("auth:signup.phone")}
                  icon="call-outline"
                  keyboardType="phone-pad"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={errors.numPhone ? errors.numPhone.message : undefined}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("auth:signup.email")}
                  icon="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={errors.email ? errors.email.message : undefined}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("auth:signup.password")}
                  icon="lock-closed-outline"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={errors.password ? errors.password.message : undefined}
                  leftIcon={
                    value && (
                      <Pressable onPress={() => setShowPassword((prev) => !prev)}>
                        <Ionicons
                          name={showPassword ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          style={{ color: "#9CA3AF" }}
                        />
                      </Pressable>
                    )
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="samePassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("auth:signup.confirmPassword")}
                  icon="lock-closed-outline"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={
                    errors.samePassword
                      ? errors.samePassword.message
                      : undefined
                  }
                  leftIcon={
                    value && (
                      <Pressable
                        onPress={() =>
                          setShowConfirmPassword((prev) => !prev)
                        }
                      >
                        <Ionicons
                          name={
                            showConfirmPassword
                              ? "eye-off-outline"
                              : "eye-outline"
                          }
                          size={20}
                          style={{ color: "#9CA3AF" }}
                        />
                      </Pressable>
                    )
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="termsAccepted"
              render={({ field: { onChange, value } }) => (
                <Checkbox
                  value={value}
                  onValueChange={onChange}
                  label={t("auth:signup.termsLabel")}
                  error={
                    errors.termsAccepted
                      ? errors.termsAccepted.message
                      : undefined
                  }
                />
              )}
            />
          </ThemedView>

          <ThemedView style={tw`my-6`} />

          <Button
            label={t("auth:signup.createAccount")}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          />

          <ThemedView style={tw`my-4`} />

          <ThemedView style={tw`flex-row justify-center items-center`}>
            <ThemedText>{t("auth:signup.alreadyHaveAccount")} </ThemedText>
            <Pressable onPress={handleGoToLogin}>
              <ThemedText type="body2">{t("auth:signup.login")}</ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView style={tw`mb-8`} />
        </ScrollView>
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
};

export default SignupScreen;
