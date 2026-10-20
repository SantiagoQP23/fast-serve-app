import { View } from "react-native";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import Card from "@/presentation/theme/components/card";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

/** Worst stock status among the items inside the folder, if any needs attention. */
export type InventoryFolderHealth = "critical" | "low" | null;

interface InventoryCategoryFolderProps {
  name: string;
  itemCount: number;
  health?: InventoryFolderHealth;
  /** Folder for items without a category. */
  isUncategorized?: boolean;
  onPress: () => void;
}

const HEALTH_DOT_COLOR: Record<NonNullable<InventoryFolderHealth>, string> = {
  critical: "bg-red-500",
  low: "bg-orange-500",
};

/** A category shown as a folder tile on the inventory screen. */
export default function InventoryCategoryFolder({
  name,
  itemCount,
  health = null,
  isUncategorized = false,
  onPress,
}: InventoryCategoryFolderProps) {
  const { t } = useTranslation("inventory");
  const icon: IconName = isUncategorized ? "folder-open" : "folder";

  return (
    <Card
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${t("categories.itemCount", { count: itemCount })}`}
      style={tw`p-4 gap-3`}
    >
      <ThemedView
        style={tw`flex-row items-start justify-between bg-transparent`}
      >
        <Icon name={icon} size={30} color={tw.color("primary")} />
        {health && (
          <View
            style={tw.style("w-2.5 h-2.5 rounded-full", HEALTH_DOT_COLOR[health])}
          />
        )}
      </ThemedView>
      <ThemedView style={tw`gap-0.5 bg-transparent`}>
        <ThemedText
          type="body1"
          numberOfLines={2}
          style={{ fontFamily: typography.semibold }}
        >
          {name}
        </ThemedText>
        <ThemedText type="small" style={tw`text-gray-500`}>
          {t("categories.itemCount", { count: itemCount })}
        </ThemedText>
      </ThemedView>
    </Card>
  );
}

interface NewCategoryFolderProps {
  onPress: () => void;
}

/** Dashed tile at the end of the folder grid that creates a category. */
export function NewCategoryFolder({ onPress }: NewCategoryFolderProps) {
  const { t } = useTranslation("inventory");

  return (
    <Card
      variant="outline"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t("categories.createCategory")}
      containerStyle={tw`border-dashed`}
      style={tw`p-4 gap-3`}
    >
      <Icon
        name="folder-plus"
        size={30}
        color={tw.color("on-surface-variant")}
      />
      <ThemedText type="small" style={tw`text-gray-500`}>
        {t("categories.createCategory")}
      </ThemedText>
    </Card>
  );
}
