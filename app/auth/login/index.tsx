import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  useWindowDimensions,
  Linking,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { router } from "expo-router";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { i18nAlert } from "@/core/i18n/utils";

const loginSchema = z.object({
  username: z.string({ message: "Username is required" }),
  password: z.string({ message: "Password is required" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginScreen = () => {
  const { t } = useTranslation("auth");
  const { height } = useWindowDimensions();
  const { login, changeStatus } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Function to handle form submission
  const onSubmit = async (data: LoginFormData) => {
    console.log(data);
    const wasSuccessful = await login(
      data.username.trim(),
      data.password.trim(),
    );

    if (wasSuccessful) {
      router.replace("/");
      return;
    }

    i18nAlert("Error", t("validations.invalidCredentials"));
  };

  // Function to handle sign up redirect
  const handleSignUp = async () => {
    const signupUrl = process.env.EXPO_PUBLIC_SIGNUP_URL;

    if (!signupUrl) {
      i18nAlert("Error", "Sign up URL is not configured");
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(signupUrl);
      if (canOpen) {
        await Linking.openURL(signupUrl);
      } else {
        i18nAlert("Error", "Cannot open sign up page");
      }
    } catch (error) {
      console.error("Error opening sign up URL:", error);
      i18nAlert("Error", "Failed to open sign up page");
    }
  };

  return (
    <KeyboardAvoidingView style={tw`flex-1`} behavior="padding">
      <ThemedView style={tw`flex-1 px-4 gap-8`}>
        <ThemedView style={[{ paddingTop: height * 0.2 }]}>
          <ThemedText type="h1">{t("login.title")}</ThemedText>
          <ThemedText>{t("login.enterCredentials")}</ThemedText>
        </ThemedView>
        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              autoCapitalize="none"
              label={t("login.username")}
              icon="person-outline"
              onBlur={onBlur}
              value={value}
              onChangeText={onChange}
              error={errors.username ? errors.username.message : undefined}
            />
          )}
        />
        <ThemedView style={tw`w-full gap-2`}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label={t("login.password")}
                autoCapitalize="none"
                secureTextEntry={!showPassword}
                icon="lock-closed-outline"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={errors.password ? errors.password.message : undefined}
                leftIcon={
                  <Pressable onPress={() => setShowPassword((prev) => !prev)}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      style={{ color: "#9CA3AF" }}
                    />
                  </Pressable>
                }
              />
            )}
          />
          <ThemedText type="body2">{t("login.forgotPassword")}</ThemedText>
        </ThemedView>
        <ThemedView style={tw`w-full `}>
          <Button
            label={t("login.loginButton")}
            onPress={handleSubmit(onSubmit)}
          />
        </ThemedView>
        <ThemedView style={tw`flex-1`}></ThemedView>
        <ThemedView style={tw`mb-4 flex-row justify-center items-center`}>
          <ThemedText>{t("login.noAccount")} </ThemedText>
          <Pressable onPress={handleSignUp}>
            <ThemedText type="body2">{t("login.signUp")}</ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
