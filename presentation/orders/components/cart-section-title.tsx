import { typography } from "@/constants/theme";
import Label from "@/presentation/theme/components/label";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";

/** Heading of a cart section, with an optional item count in a Label. */
export default function CartSectionTitle({
  title,
  count,
}: {
  title: string;
  count?: number;
}) {
  return (
    <ThemedView style={tw`flex-row items-center gap-2 min-h-8`}>
      <ThemedText
        type="h4"
        accessibilityRole="header"
        style={{ fontFamily: typography.semibold }}
      >
        {title}
      </ThemedText>
      {count !== undefined && (
        <Label text={String(count)} color="default" size="small" />
      )}
    </ThemedView>
  );
}
