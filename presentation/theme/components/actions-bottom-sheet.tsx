import { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { GroupedList } from "@/presentation/theme/components/grouped-list";

export interface ActionsBottomSheetItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
  onPress: () => void;
  disabled?: boolean;
}

interface ActionsBottomSheetProps {
  title?: string;
  subtitle?: string;
  items: ActionsBottomSheetItem[];
}

export default function ActionsBottomSheet({
  title,
  subtitle,
  items,
}: ActionsBottomSheetProps) {
  return (
    <BottomSheetView style={tw`px-4 pb-6`}>
      {(title || subtitle) && (
        <ThemedView style={tw`mb-4`}>
          {title && <ThemedText type="h3">{title}</ThemedText>}
          {subtitle && (
            <ThemedText type="body2" style={tw`text-gray-500 mt-1`}>
              {subtitle}
            </ThemedText>
          )}
        </ThemedView>
      )}

      <GroupedList
        data={items}
        keyExtractor={(item, index) => `${item.label}-${index}`}
        onItemPress={(item) => !item.disabled && item.onPress()}
        renderItem={(item) => (
          <ThemedView
            style={tw.style(
              "flex-row items-center gap-3",
              item.disabled && "opacity-40",
            )}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={
                item.color
                  ? tw.color(item.color.replace("text-", ""))
                  : tw.color("gray-700")
              }
            />
            <ThemedText
              type="body1"
              style={tw.style("flex-1", item.color && item.color)}
            >
              {item.label}
            </ThemedText>
            {!item.disabled && (
              <Ionicons
                name="chevron-forward"
                size={18}
                color={tw.color("gray-400")}
              />
            )}
          </ThemedView>
        )}
      />
    </BottomSheetView>
  );
}
