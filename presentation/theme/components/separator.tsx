import { View, type StyleProp, type ViewStyle } from "react-native";
import tw from "../lib/tailwind";

type SeparatorProps = {
  orientation?: "horizontal" | "vertical";
  style?: StyleProp<ViewStyle>;
};

/** A thin line for splitting sections without cards. */
export default function Separator({
  orientation = "horizontal",
  style,
}: SeparatorProps) {
  return (
    <View
      accessibilityRole="none"
      style={[
        tw`bg-primary self-stretch`,
        orientation === "horizontal" ? tw`h-0.5` : tw`w-0.5`,
        style,
      ]}
    />
  );
}
