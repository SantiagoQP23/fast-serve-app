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

import { router } from "expo-router";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

const LoginScreen = () => {
  const { height } = useWindowDimensions();
  const { login, changeStatus } = useAuthStore();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const onLogin = async () => {
    const { email, password } = form;

    console.log({ email, password });

    if (email.length === 0 || password.length === 0) {
      return;
    }

    const wasSuccessful = await changeStatus("alksjdf;", { name: "Demo User" });

    if (wasSuccessful) {
      Alert.alert("Success", "Usuario autenticado correctamente");
      router.replace("/");
      return;
    }

    Alert.alert("Error", "Usuario o contraseña no son correctos");
  };

  return (
    <KeyboardAvoidingView style={tw`flex-1`} behavior="padding">
      <ThemedView style={tw`flex-1 px-4 gap-4`}>
        <ThemedView style={[{ paddingTop: height * 0.2 }]}>
          <ThemedText type="title">Login</ThemedText>
          <ThemedText>Enter your credentials</ThemedText>
        </ThemedView>
        <TextInput
          autoCapitalize="none"
          label="Username"
          icon="person-outline"
        />
        <ThemedView style={tw`w-full gap-2`}>
          <TextInput
            label="Password"
            autoCapitalize="none"
            secureTextEntry
            icon="lock-closed-outline"
            value={form.password}
            onChangeText={(value) => setForm({ ...form, password: value })}
          />
          <ThemedText type="link">Forgot password?</ThemedText>
        </ThemedView>
        <ThemedView style={tw`w-full `}>
          <Button label="Login" onPress={onLogin} />
        </ThemedView>
        <ThemedView style={tw`flex-1`}></ThemedView>
        <ThemedView style={tw`mb-4 flex-row justify-center`}>
          <ThemedText>
            Don't have an account? <ThemedText type="link">Sign up</ThemedText>
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
