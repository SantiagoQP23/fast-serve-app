import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
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

/** The hour ("14:00") above that hour's cards within a day, trailed by a hairline. */
export function HourSectionHeader({ hour }: { hour: string }) {
  return (
    <ThemedView style={tw`flex-row items-center gap-3 bg-transparent`}>
      <ThemedText
        type="small"
        style={[tw`text-gray-500`, { fontVariant: ["tabular-nums"] }]}
      >
        {hour}
      </ThemedText>
      <ThemedView style={tw`flex-1 h-px bg-light-border`} />
    </ThemedView>
  );
}
