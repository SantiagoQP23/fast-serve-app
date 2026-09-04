import { useRef, useCallback } from "react";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "../lib/tailwind";
import { ThemedText } from "./themed-text";
import { typography } from "@/constants/theme";
import { ThemedView } from "./themed-view";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";

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
};

export default function Select({
  label,
  options,
  value,
  placeholder = "Select an option",
  onChange,
  searchable,
  searchPlaceholder = "Search...",
  snapPoints = ["40%", "70%", "90%"],
}: SelectProps) {
  const bottomSheetPickerRef = useRef<BottomSheetPickerRef>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleOpen = useCallback(() => {
    bottomSheetPickerRef.current?.present();
  }, []);

  return (
    <>
      <ThemedView style={tw`w-full gap-2`}>
        {label && (
          <ThemedText style={[tw` dark:text-gray-300 ml-2 `]}>
            {label}
          </ThemedText>
        )}

        <Pressable
          onPress={handleOpen}
          style={tw` dark:border-gray-700 bg-light-surface-high dark:bg-gray-800 rounded-3xl px-4 py-3 flex-row justify-between items-center `}
        >
          <ThemedText
            style={[
              tw.style(
                selectedOption
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-400",
              ),
              { fontFamily: typography.regular },
            ]}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </ThemedText>
          <Ionicons name="chevron-down" size={20} color="#9ca3af" />
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
      />
    </>
  );
}
