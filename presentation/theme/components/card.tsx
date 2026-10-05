import tw from "@/presentation/theme/lib/tailwind";
import { Pressable, PressableProps } from "react-native";
import { ThemedView } from "./themed-view";

type CardVariant = "default" | "outline" | "elevated";

type CardProps = PressableProps & {
  variant?: CardVariant;
};

const containerVariantStyles: Record<CardVariant, string> = {
  default: " bg-light-surface rounded-3xl",
  outline: "border border-light-border rounded-3xl",
  elevated: "shadow-sm bg-transparent rounded-3xl",
};

export default function Card({
  onPress,
  children,
  style,
  variant = "default",
  ...rest
}: CardProps) {
  return (
    <ThemedView style={tw`${containerVariantStyles[variant]}`}>
      <Pressable
        {...rest}
        style={(state) =>
          [
            tw`p-6 rounded-3xl bg-transparent`,
            state.pressed && tw`opacity-80`,
            typeof style === "function" ? style(state) : style,
          ].filter(Boolean)
        }
        onPress={onPress}
      >
        {children}
      </Pressable>
    </ThemedView>
  );
}
