import Card from "@/presentation/theme/components/card";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";

interface InventoryNavCardProps {
  icon: IconName;
  title: string;
  /** One line of live context, e.g. how many items the page holds. */
  subtitle?: string;
  onPress: () => void;
}

/** Grid card on the Productos hub that opens one of its pages. */
export default function InventoryNavCard({
  icon,
  title,
  subtitle,
  onPress,
}: InventoryNavCardProps) {
  return (
    <Card
      variant="outline"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      containerStyle={tw`flex-1`}
      style={tw`p-4 gap-3`}
    >
      <Icon name={icon} size={24} color={tw.color("on-surface")} />
      <ThemedView style={tw`gap-0.5 bg-transparent`}>
        <ThemedText
          type="body1"
          style={{ fontFamily: typography.bold }}
          numberOfLines={1}
        >
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText
            type="body2"
            style={tw`text-gray-500`}
            numberOfLines={1}
          >
            {subtitle}
          </ThemedText>
        )}
      </ThemedView>
    </Card>
  );
}
