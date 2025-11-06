import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import tw from "twrnc";

const LoginScreen = () => {
  const { height } = useWindowDimensions();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

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
          <Button label="Login" />
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
