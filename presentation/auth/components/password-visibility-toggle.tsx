import { Pressable } from "react-native";
import Icon from "@/presentation/theme/components/icon";
import tw from "@/presentation/theme/lib/tailwind";

interface Props {
  visible: boolean;
  onToggle: () => void;
}

export default function PasswordVisibilityToggle({ visible, onToggle }: Props) {
  return (
    <Pressable onPress={onToggle}>
      <Icon
        name={visible ? "eye-off" : "eye"}
        size={20}
        style={{ color: tw.color("gray-400") }}
      />
    </Pressable>
  );
}
