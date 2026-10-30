import type { ReactNode } from "react";
import type { SharedValue } from "react-native-reanimated";
import tw from "../lib/tailwind";
import { typography } from "@/constants/theme";
import Icon, { type IconName } from "./icon";
import { labelSolidStyles, type LabelProps } from "./label";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { CollapsibleBlock } from "./collapsible-header-title";

interface DetailHeaderProps {
  /** Without one the title leads, e.g. a production area. */
  amount?: string;
  title: string;
  subtitle?: string;
  /** Right under the title, e.g. an "Inactive" Label. */
  status?: ReactNode;
  /** What the record is, e.g. the payment method; drawn in a circle. */
  icon?: IconName;
  /** Status pinned to the icon's corner. */
  badge?: {
    color: NonNullable<LabelProps["color"]>;
    icon: IconName;
    label: string;
  };
  /** Pill actions under the header. */
  children?: ReactNode;
  /** The screen's scroll offset: the title then fades into the nav header
   * (pair with `CollapsibleHeaderTitle`). */
  scrollY?: SharedValue<number>;
}

/** Amount-first header for detail screens (bill, transaction). */
export default function DetailHeader({
  amount,
  title,
  subtitle,
  status,
  icon,
  badge,
  children,
  scrollY,
}: DetailHeaderProps) {
  const top = (
    <ThemedView style={tw`flex-row items-start gap-4`}>
      <ThemedView style={tw`flex-1 gap-1`}>
        {amount != null ? (
          <>
            <ThemedText
              type="h1"
              // h1 fixes its height for 32px text; size the box for 44px.
              style={{
                fontSize: 44,
                fontFamily: typography.bold,
                lineHeight: 54,
                height: 54,
              }}
            >
              {amount}
            </ThemedText>
            <ThemedText type="h4">{title}</ThemedText>
          </>
        ) : (
          // h2 has no fixed height, so long names can wrap
          <ThemedText type="h2">{title}</ThemedText>
        )}
        {!!status && (
          // A row, so a Label keeps its own width
          <ThemedView style={tw`flex-row`}>{status}</ThemedView>
        )}
        {!!subtitle && (
          <ThemedText type="body1" style={tw`text-gray-500`}>
            {subtitle}
          </ThemedText>
        )}
      </ThemedView>

      {icon && (
        <ThemedView
          accessible={!!badge}
          accessibilityLabel={badge?.label}
          style={tw`w-16 h-16 mt-1 rounded-full items-center justify-center bg-surface`}
        >
          <Icon name={icon} size={28} color={tw.color("primary")} />
          {badge && (
            <ThemedView
              style={[
                tw`absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full items-center justify-center ${labelSolidStyles[badge.color].dot}`,
                { borderWidth: 2, borderColor: tw.color("background") },
              ]}
            >
              <Icon name={badge.icon} size={12} color="white" />
            </ThemedView>
          )}
        </ThemedView>
      )}
    </ThemedView>
  );

  return (
    <ThemedView style={tw`gap-5 mb-2`}>
      {scrollY ? (
        <CollapsibleBlock scrollY={scrollY}>{top}</CollapsibleBlock>
      ) : (
        top
      )}

      {children}
    </ThemedView>
  );
}
