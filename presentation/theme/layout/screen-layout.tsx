import { type ViewProps } from "react-native";
import { ThemedView } from "../components/themed-view";
import tw from "../lib/tailwind";

export type ScreenLayoutProps = ViewProps & {};
export function ScreenLayout({ children, style }: ScreenLayoutProps) {
  return (
    <ThemedView style={[tw`flex-1 bg-light-background`, style]}>
      {children}
    </ThemedView>
  );
}
