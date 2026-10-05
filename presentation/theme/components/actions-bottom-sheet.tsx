import { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";

export interface ActionsBottomSheetItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
  onPress: () => void;
  disabled?: boolean;
}

export interface ActionsBottomSheetSection {
  title?: string;
  items: ActionsBottomSheetItem[];
}

interface ActionsBottomSheetProps {
  title?: string;
  subtitle?: string;
  items?: ActionsBottomSheetItem[];
  sections?: ActionsBottomSheetSection[];
}

export default function ActionsBottomSheet({
  title,
  subtitle,
  items,
  sections,
}: ActionsBottomSheetProps) {
  const resolvedSections = (sections ?? [{ items: items ?? [] }]).filter(
    (section) => section.items.length > 0,
  );

  return (
    <BottomSheetView style={tw`px-8 pb-6`}>
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

      <ThemedView>
        {resolvedSections.map((section, sectionIndex) => (
          <ThemedView
            key={section.title ?? `section-${sectionIndex}`}
            style={tw.style(
              sectionIndex > 0 && "pt-3 mt-3 border-t border-light-border",
            )}
          >
            {section.title && (
              <ThemedText
                type="caption"
                style={tw`text-gray-500 font-semibold mb-1`}
              >
                {section.title}
              </ThemedText>
            )}
            {section.items.map((item, index) => (
              <Pressable
                key={`${item.label}-${index}`}
                disabled={item.disabled}
                onPress={item.onPress}
                style={(state) =>
                  tw.style(
                    "flex-row items-center gap-3 py-3",
                    state.pressed && "opacity-60",
                    item.disabled && "opacity-40",
                  )
                }
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
              </Pressable>
            ))}
          </ThemedView>
        ))}
      </ThemedView>
    </BottomSheetView>
  );
}
