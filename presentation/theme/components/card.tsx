import tw from "@/presentation/theme/lib/tailwind";
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { ThemedView } from "./themed-view";

type CardVariant = "default" | "outline" | "elevated";

type CardProps = PressableProps & {
  variant?: CardVariant;
  /** Styles for the outer container (background, border, margin, shadow…). `style` targets the inner pressable. */
  containerStyle?: StyleProp<ViewStyle>;
};

const containerVariantStyles: Record<CardVariant, string> = {
  default: " bg-light-surface rounded-3xl",
  outline: "border border-light-border rounded-3xl bg-transparent",
  // Elevation needs an opaque fill: Android casts the shadow from the
  // background outline, and iOS would otherwise shadow the children.
  elevated: "bg-light-surface-container-low rounded-3xl",
};

export default function Card({
  onPress,
  children,
  style,
  variant = "default",
  containerStyle,
  ...rest
}: CardProps) {
  return (
    <ThemedView
      style={[
        tw`${containerVariantStyles[variant]}`,
        variant === "elevated" && shadows.elevated,
        containerStyle,
      ]}
    >
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

const shadows = StyleSheet.create({
  // Resting lift (Material 3 elevation level 1): soft offset shadow on iOS,
  // native elevation on Android.
  elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
});
