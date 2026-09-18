import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
        style={{ color: "#9CA3AF" }}
      />
    </Pressable>
  );
}
