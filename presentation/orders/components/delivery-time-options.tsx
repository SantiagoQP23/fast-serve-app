import { useState } from "react";
import { Pressable } from "react-native";
import dayjs from "dayjs";

import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { DEFAULT_ORDER_PREP_TIME } from "@/core/restaurant/models/restaurant-settings.model";
import { typography } from "@/constants/theme";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Icon from "@/presentation/theme/components/icon";
import SectionTitle from "@/presentation/theme/components/section-title";
import { useRestaurantSettings } from "@/presentation/restaurant/hooks/useRestaurantSettings";

interface DeliveryTimeOptionsProps {
  value: Date | null;
  /** Back to the restaurant's standard prep time (no delivery time). */
  onStandard: () => void;
  /** Pick a specific time, e.g. by opening the time sheet. */
  onSchedule: () => void;
}

function DeliveryOption({
  title,
  description,
  selected,
  onPress,
}: {
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        // The thicker selected border eats into the padding so rows don't shift.
        selected
          ? tw`border-2 border-primary px-[15px] py-[11px]`
          : tw`border border-gray-200 px-4 py-3`,
        tw`flex-row items-baseline gap-2 rounded-2xl`,
        pressed && tw`opacity-60`,
      ]}
    >
      <ThemedText style={{ fontFamily: typography.bold }}>{title}</ThemedText>
      <ThemedText type="body2" style={tw`text-gray-500 flex-1`}>
        {description}
      </ThemedText>
    </Pressable>
  );
}

/**
 * Standard (the restaurant's prep time) or a scheduled delivery time. With no
 * delivery time set, the order is standard. Collapsed, the box shows only the
 * current choice; tap it to see both options.
 */
export default function DeliveryTimeOptions({
  value,
  onStandard,
  onSchedule,
}: DeliveryTimeOptionsProps) {
  const { t } = useTranslation(["orders"]);
  const { settings } = useRestaurantSettings();
  const prepTime = settings?.ORDER_PREP_TIME ?? DEFAULT_ORDER_PREP_TIME;
  const [expanded, setExpanded] = useState(false);

  const standard = {
    title: t("orders:newOrder.deliveryStandard"),
    description: t("orders:elapsed.minutes", { count: prepTime }),
  };
  const schedule = {
    title: t("orders:newOrder.deliverySchedule"),
    description: value
      ? dayjs(value).format("HH:mm")
      : t("orders:newOrder.selectTime"),
  };
  const current = value ? schedule : standard;

  return (
    <ThemedView style={tw`gap-3`}>
      <SectionTitle title={t("orders:form.deliveryTime")} />
      <ThemedView style={tw`border border-gray-200 rounded-2xl`}>
        <Pressable
          onPress={() => setExpanded((open) => !open)}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          style={({ pressed }) => [
            tw`flex-row items-center gap-3 px-4 py-3`,
            pressed && tw`opacity-60`,
          ]}
        >
          <ThemedView style={tw`flex-1 bg-transparent`}>
            <ThemedText style={{ fontFamily: typography.bold }}>
              {current.title}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {current.description}
            </ThemedText>
          </ThemedView>
          <Icon
            name={expanded ? "chevron-up" : "chevron-down"}
            size={24}
            color={tw.color("gray-500")}
          />
        </Pressable>

        {expanded && (
          <ThemedView style={tw`gap-2 px-3 pb-3 bg-transparent`}>
            <DeliveryOption
              {...standard}
              selected={!value}
              onPress={onStandard}
            />
            <DeliveryOption
              {...schedule}
              selected={!!value}
              onPress={onSchedule}
            />
          </ThemedView>
        )}
      </ThemedView>
    </ThemedView>
  );
}
