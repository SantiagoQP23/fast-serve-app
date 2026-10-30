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
  default: " bg-surface-container-low rounded-2xl",
  outline: "border-2 border-primary  bg-transparent rounded-2xl",
  // Elevation needs an opaque fill: Android casts the shadow from the
  // background outline, and iOS would otherwise shadow the children.
  elevated: "bg-surface-container-low rounded-2xl ",
};

export default function Card({
  onPress,
  children,
  style,
  variant = "outline",
  containerStyle,
  ...rest
}: CardProps) {
  const outerStyle: ViewStyle = StyleSheet.flatten([
    tw`${containerVariantStyles[variant]}`,
    variant === "elevated" && shadows.elevated,
    containerStyle,
  ]);
  // Callers tint the inner pressable (e.g. `bg-secondary` when selected), so
  // it needs the container's rounding, inset by the border, or the fill
  // shows square corners inside the rounded outline.
  const innerRadius = Math.max(
    0,
    (Number(outerStyle.borderRadius) || 0) -
      (Number(outerStyle.borderWidth) || 0),
  );

  return (
    <ThemedView style={outerStyle}>
      <Pressable
        {...rest}
        style={(state) =>
          [
            tw`p-6  bg-transparent`,
            { borderRadius: innerRadius },
            state.pressed && onPress && tw`opacity-80`,
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
  // Resting lift: a wide, faint diffuse shadow on iOS, the lowest native
  // elevation on Android (its shadow can't be blurred further).
  elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
  },
});
