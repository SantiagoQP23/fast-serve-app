import { typography } from "@/constants/theme";
import tw from "../lib/tailwind";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

interface SectionTitleProps {
  title: string;
  /** Shown in gray next to the title, e.g. how many items the section has. */
  count?: number;
}

/** A bold heading that opens a section of a screen. */
export default function SectionTitle({ title, count }: SectionTitleProps) {
  return (
    <ThemedView style={tw`flex-row items-center gap-2`}>
      <ThemedText
        type="h3"
        accessibilityRole="header"
        style={{ fontFamily: typography.bold }}
      >
        {title}
      </ThemedText>
      {count !== undefined && (
        <ThemedText type="h3" style={tw`text-gray-500`}>
          {count}
        </ThemedText>
      )}
    </ThemedView>
  );
}
