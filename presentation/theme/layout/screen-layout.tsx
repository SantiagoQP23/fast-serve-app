import { type ViewProps } from "react-native";
import { CONTENT_MAX_WIDTH } from "@/constants/breakpoints";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";
import { ThemedView } from "../components/themed-view";
import tw from "../lib/tailwind";

export type ScreenLayoutProps = ViewProps & {
  /**
   * Let the content span the whole window on tablets. By default content is
   * centered and capped at CONTENT_MAX_WIDTH so forms and lists don't stretch.
   */
  fullWidth?: boolean;
};
export function ScreenLayout({
  children,
  style,
  fullWidth,
}: ScreenLayoutProps) {
  const { isTablet } = useResponsiveLayout();

  if (fullWidth || !isTablet) {
    return (
      <ThemedView style={[tw`flex-1 bg-light-background`, style]}>
        {children}
      </ThemedView>
    );
  }

  return (
    <ThemedView style={tw`flex-1 bg-light-background`}>
      <ThemedView
        style={[
          tw`flex-1 w-full self-center bg-light-background`,
          { maxWidth: CONTENT_MAX_WIDTH },
          style,
        ]}
      >
        {children}
      </ThemedView>
    </ThemedView>
  );
}
