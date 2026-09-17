import tw from "@/presentation/theme/lib/tailwind";
import { Pressable, PressableProps } from "react-native";
import { ThemedView } from "./themed-view";

type CardVariant = "default" | "outline";

type CardProps = PressableProps & {
  variant?: CardVariant;
};

const containerVariantStyles: Record<CardVariant, string> = {
  default: "shadow-xs bg-light-surface rounded-3xl",
  outline: "border border-light-border bg-light-surface rounded-3xl",
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
            tw`p-6 rounded-3xl `,
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
