import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";

interface Props {
  visible: boolean;
  onToggle: () => void;
}

export default function PasswordVisibilityToggle({ visible, onToggle }: Props) {
  return (
    <Pressable onPress={onToggle}>
      <Ionicons
        name={visible ? "eye-off-outline" : "eye-outline"}
        size={20}
        style={{ color: tw.color("gray-400") }}
      />
    </Pressable>
  );
}
