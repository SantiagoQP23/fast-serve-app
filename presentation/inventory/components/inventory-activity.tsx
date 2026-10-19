import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

dayjs.extend(relativeTime);

export interface InventoryActivityEntry {
  label: string;
  date: string | Date;
}

interface InventoryActivityProps {
  entries: InventoryActivityEntry[];
}

/** What happened and when, at the bottom of a detail — the order screen's activity block. */
export default function InventoryActivity({ entries }: InventoryActivityProps) {
  const { t } = useTranslation("inventory");

  if (entries.length === 0) return null;

  return (
    <ThemedView style={tw`gap-3 pt-2 bg-transparent`}>
      <ThemedText
        type="caption"
        accessibilityRole="header"
        style={tw`text-gray-500`}
      >
        {t("activity.title")}
      </ThemedText>
      <ThemedView style={tw`gap-2 bg-transparent`}>
        {entries.map((entry) => {
          const date = dayjs(entry.date);
          return (
            <ThemedView key={entry.label} style={tw`bg-transparent`}>
              <ThemedView
                style={tw`flex-row items-center gap-2 bg-transparent`}
              >
                <Icon name="circle" size={12} color={tw.color("gray-500")} />
                <ThemedText type="body2" style={tw`text-gray-600`}>
                  {entry.label}
                </ThemedText>
              </ThemedView>
              <ThemedText type="small" style={tw`text-gray-500 ml-5`}>
                {`${date.fromNow()} · ${date.format("MMM D, HH:mm")}`}
              </ThemedText>
            </ThemedView>
          );
        })}
      </ThemedView>
    </ThemedView>
  );
}
