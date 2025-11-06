import { View, type ViewProps } from "react-native";
import { useThemeColor } from "../hooks/use-theme-color";

import tw from "twrnc";

export type ThemedViewProps = ViewProps & {};

export function ThemedView({
  style,
  className,
  children,
  ...otherProps
}: ThemedViewProps) {
  return (
    <View style={[tw`bg-white dark:bg-black`, style]} {...otherProps}>
      {children}
    </View>
  );
}
