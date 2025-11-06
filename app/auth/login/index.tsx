import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import {
  KeyboardAvoidingView,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import tw from "twrnc";

const LoginScreen = () => {
  const { height } = useWindowDimensions();

  return (
    <KeyboardAvoidingView style={tw`flex-1`} behavior="padding">
      <ThemedView style={tw`flex-1 px-4 gap-4`}>
        <ThemedView style={[{ paddingTop: height * 0.2 }]}>
          <ThemedText type="title">Login</ThemedText>
          <ThemedText>Enter your credentials</ThemedText>
        </ThemedView>
        <TextInput numberOfLines={5} multiline label="Username" />
        <TextInput numberOfLines={5} multiline label="Password" />
        <ThemedView style={tw`w-full `}>
          <Button label="Login" />
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
