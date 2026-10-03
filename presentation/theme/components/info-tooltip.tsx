import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedText } from "@/presentation/theme/components/themed-text";

const TOOLTIP_WIDTH = 200;
const AUTO_DISMISS_MS = 5000;

interface InfoTooltipProps {
  text: string;
}

// Renders in-place (no Modal/measure): a Modal mounts at the app root and a
// measure() pageX/pageY read against that root, but this component often
// lives inside a native bottom sheet surface, so both report the wrong
// place — positioning it as a plain absolute sibling keeps it in the same
// surface.
export default function InfoTooltip({ text }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);
  const dismissTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (dismissTimeout.current) clearTimeout(dismissTimeout.current);
    };
  }, []);

  const toggle = () => {
    if (dismissTimeout.current) clearTimeout(dismissTimeout.current);
    setVisible((current) => {
      const next = !current;
      if (next) {
        dismissTimeout.current = setTimeout(
          () => setVisible(false),
          AUTO_DISMISS_MS,
        );
      }
      return next;
    });
  };

  return (
    <View style={{ position: "relative" }}>
      <Pressable onPress={toggle} hitSlop={8}>
        <Ionicons
          name="information-circle-outline"
          size={18}
          color={tw.color("gray-400")}
        />
      </Pressable>

      {visible && (
        <View
          style={[
            tw`absolute rounded-xl border border-gray-200 dark:border-gray-700 bg-light-surface-container-low dark:bg-black p-3`,
            {
              top: 24,
              right: 0,
              width: TOOLTIP_WIDTH,
              zIndex: 50,
              elevation: 5,
            },
          ]}
        >
          <ThemedText type="small">{text}</ThemedText>
        </View>
      )}
    </View>
  );
}
