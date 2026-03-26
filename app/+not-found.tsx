import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import tw from "@/presentation/theme/lib/tailwind";

export default function NotFound() {
  return (
    <ScreenLayout style={tw`justify-center items-center`}>
      <ThemedText type="h2">404 - Not Found</ThemedText>
      <ThemedText type="body1">
        The page you are looking for does not exist.
      </ThemedText>
    </ScreenLayout>
  );
}
