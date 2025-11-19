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
} from "react-native";
import tw from "@/presentation/theme/lib/tailwind";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { router } from "expo-router";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

const loginSchema = z.object({
  username: z.string({ message: "Username is required" }),
  password: z.string({ message: "Password is required" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginScreen = () => {
  const { height } = useWindowDimensions();
  const { login, changeStatus } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "SantiagoQP23",
      password: "SantiagoQP23",
    },
  });

  // Function to handle form submission
  const onSubmit = async (data: LoginFormData) => {
    console.log(data);
    const wasSuccessful = await login(data.username, data.password);

    if (wasSuccessful) {
      router.replace("/");
      return;
    }

    Alert.alert("Error", "Usuario o contraseña no son correctos");
  };

  return (
    <KeyboardAvoidingView style={tw`flex-1`} behavior="padding">
      <ThemedView style={tw`flex-1 px-4 gap-8`}>
        <ThemedView style={[{ paddingTop: height * 0.2 }]}>
          <ThemedText type="h1">Login</ThemedText>
          <ThemedText>Enter your credentials</ThemedText>
        </ThemedView>
        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              autoCapitalize="none"
              label="Username"
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
                label="Password"
                autoCapitalize="none"
                secureTextEntry
                icon="lock-closed-outline"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={errors.password ? errors.password.message : undefined}
              />
            )}
          />
          <ThemedText type="body2">Forgot password?</ThemedText>
        </ThemedView>
        <ThemedView style={tw`w-full `}>
          <Button label="Login" onPress={handleSubmit(onSubmit)} />
        </ThemedView>
        <ThemedView style={tw`flex-1`}></ThemedView>
        <ThemedView style={tw`mb-4 flex-row justify-center`}>
          <ThemedText>
            Don't have an account? <ThemedText type="body2">Sign up</ThemedText>
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
