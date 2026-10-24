import type { ReactNode } from "react";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { formatTime, getRelativeDate } from "@/core/i18n/utils";

/** "Today, 07:23" — when a count or purchase happened, as the subtitle of its detail. */
export const formatDetailMoment = (date: string | Date) =>
  `${getRelativeDate(date)}, ${formatTime(date)}`;

interface InventoryDetailTitleProps {
  icon: IconName;
  title: string;
  /** One line under the title, e.g. when it happened. */
  subtitle?: string;
  /** Status labels shown under the title. */
  labels?: ReactNode;
  /** Anything that belongs with the title block, e.g. a progress bar. */
  children?: ReactNode;
}

/** Title block of a detail screen, laid out like the order screen's header. */
export default function InventoryDetailTitle({
  icon,
  title,
  subtitle,
  labels,
  children,
}: InventoryDetailTitleProps) {
  return (
    <ThemedView style={tw`gap-4 bg-transparent`}>
      <ThemedView style={tw`gap-1 bg-transparent`}>
        <Icon
          name={icon}
          size={40}
          color={tw.color("text")}
          style={tw`mb-2`}
        />
        {/* Item names can be long; two lines before truncating */}
        <ThemedText type="h2" numberOfLines={2}>
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText type="body1" style={tw`text-gray-500`}>
            {subtitle}
          </ThemedText>
        )}
      </ThemedView>

      {labels && (
        <ThemedView
          style={tw`flex-row items-center gap-2 flex-wrap bg-transparent`}
        >
          {labels}
        </ThemedView>
      )}

      {children}
    </ThemedView>
  );
}
