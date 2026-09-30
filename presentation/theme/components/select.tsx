import { useRef, useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "../lib/tailwind";
import { ThemedText } from "./themed-text";
import { typography } from "@/constants/theme";
import { ThemedView } from "./themed-view";
import BottomSheetPicker, {
  type BottomSheetPickerAction,
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";

const CONTAINER_HEIGHT = 56;
const LABEL_REST_POSITION = 16;
const LABEL_FLOAT_POSITION = 9;
const LABEL_REST_SIZE = 16;
const LABEL_FLOAT_SIZE = 11;
const VALUE_MARGIN_TOP = 25;

type Option = {
  label: string;
  value: string | number;
};

type SelectProps = {
  label?: string;
  options: Option[];
  value?: string | number;
  placeholder?: string;
  onChange: (value: string | number) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  snapPoints?: string[];
  headerAction?: BottomSheetPickerAction;
  footerAction?: BottomSheetPickerAction;
  variant?: "filled" | "outlined";
};

export default function Select({
  label,
  options,
  value,
  placeholder = "",
  onChange,
  searchable,
  searchPlaceholder = "Search...",
  snapPoints = ["40%", "70%", "90%"],
  headerAction,
  footerAction,
  variant = "filled",
}: SelectProps) {
  const bottomSheetPickerRef = useRef<BottomSheetPickerRef>(null);
  const [isPressed, setIsPressed] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);
  const hasValueLine = !!(selectedOption || placeholder);

  const handleOpen = useCallback(() => {
    bottomSheetPickerRef.current?.present();
  }, []);

  const labelColor = isPressed
    ? tw.color("light-primary")
    : tw.color("gray-500");

  const borderColor = isPressed
    ? tw.color("light-primary")
    : variant === "outlined"
      ? tw.color("light-border")
      : "transparent";

  return (
    <>
      <ThemedView>
        <Pressable
          onPress={handleOpen}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          style={[
            tw.style(
              "flex-row rounded-3xl px-3",
              variant === "filled" ? "bg-light-surface-high" : "bg-transparent",
            ),
            {
              minHeight: CONTAINER_HEIGHT,
              borderWidth: variant === "outlined" ? 1 : 0,
              borderColor,
            },
          ]}
        >
          <View style={[tw`flex-1`, { alignSelf: "stretch" }]}>
            {label && (
              <ThemedText
                numberOfLines={1}
                style={{
                  position: "absolute",
                  left: 4,
                  right: 0,
                  top: hasValueLine
                    ? LABEL_FLOAT_POSITION
                    : LABEL_REST_POSITION,
                  fontSize: hasValueLine ? LABEL_FLOAT_SIZE : LABEL_REST_SIZE,
                  fontFamily: typography.medium,
                  color: labelColor,
                  includeFontPadding: false,
                }}
              >
                {label}
              </ThemedText>
            )}
            {hasValueLine && (
              <ThemedText
                numberOfLines={1}
                style={{
                  fontSize: 16,
                  fontFamily: typography.medium,
                  marginTop: label ? VALUE_MARGIN_TOP : 0,
                  marginLeft: 4,
                  includeFontPadding: false,
                  color: selectedOption
                    ? tw.color("text")
                    : tw.color("light-on-surface-variant"),
                }}
              >
                {selectedOption ? selectedOption.label : placeholder}
              </ThemedText>
            )}
          </View>
          <Ionicons
            name="chevron-down"
            size={18}
            style={{ marginLeft: 8, alignSelf: "center" }}
            color={tw.color("light-on-surface-variant")}
          />
        </Pressable>
      </ThemedView>

      <BottomSheetPicker
        ref={bottomSheetPickerRef}
        title={label}
        options={options}
        value={value}
        onChange={onChange}
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        snapPoints={snapPoints}
        headerAction={headerAction}
        footerAction={footerAction}
      />
    </>
  );
}
