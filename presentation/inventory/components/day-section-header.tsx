import { ThemedText } from "@/presentation/theme/components/themed-text";
import tw from "@/presentation/theme/lib/tailwind";
import { getRelativeDate } from "@/core/i18n/utils";

/** "Hoy", "Ayer" or the date, above a day's group of cards. */
export default function DaySectionHeader({ day }: { day: string }) {
  return (
    <ThemedText
      type="caption"
      style={tw`text-gray-500 font-semibold pt-2`}
      accessibilityRole="header"
    >
      {getRelativeDate(day)}
    </ThemedText>
  );
}

