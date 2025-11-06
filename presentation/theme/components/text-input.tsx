import {
  View,
  TextInput as RNTextInput,
  Text,
  TextInputProps,
} from "react-native";
import tw from "twrnc";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export default function TextInput({ label, error, ...props }: Props) {
  return (
    <View>
      {label && <Text style={tw`text-base text-gray-800 mb-2`}>{label}</Text>}
      <RNTextInput
        style={tw.style(
          "border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-white",
          error ? "border-red-500" : "border-gray-300",
        )}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error && <Text style={tw`text-red-500 text-sm mt-1`}>{error}</Text>}
    </View>
  );
}
