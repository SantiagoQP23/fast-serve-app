import React, {
  useState,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Pressable, Text, View } from "react-native";
import {
  BottomSheetView,
  BottomSheetFlatList,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import tw from "../lib/tailwind";
import TextInput from "./text-input";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "./themed-text";
import { typography } from "@/constants/theme";
import { ThemedView } from "./themed-view";

export type Option = {
  label: string;
  value: string | number;
};

type BottomSheetPickerProps = {
  title?: string;
  options: Option[];
  value?: string | number;
  onChange: (value: string | number) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  snapPoints?: string[];
};

export type BottomSheetPickerRef = {
  present: () => void;
  dismiss: () => void;
};

const BottomSheetPicker = forwardRef<
  BottomSheetPickerRef,
  BottomSheetPickerProps
>(
  (
    {
      title,
      options,
      value,
      onChange,
      searchable,
      searchPlaceholder = "Search...",
      snapPoints = ["40%", "70%", "90%"],
    },
    ref,
  ) => {
    const bottomSheetModalRef = React.useRef<BottomSheetMethods>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const isSearchable =
      searchable !== undefined ? searchable : options.length > 5;

    useImperativeHandle(ref, () => ({
      present: () => {
        setSearchQuery("");
        bottomSheetModalRef.current?.present();
      },
      dismiss: () => {
        bottomSheetModalRef.current?.dismiss();
      },
    }));

    const handleSelect = useCallback(
      (selectedValue: string | number) => {
        onChange(selectedValue);
        bottomSheetModalRef.current?.dismiss();
      },
      [onChange],
    );

    const handleClose = useCallback(() => {
      bottomSheetModalRef.current?.dismiss();
    }, []);

    const filteredOptions = useMemo(() => {
      if (!searchQuery.trim()) return options;
      return options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }, [options, searchQuery]);

    return (
      <ThemedBottomSheetModal ref={bottomSheetModalRef} enablePanDownToClose>
        <BottomSheetView style={tw` px-4 `}>
          {/* Header */}
          <ThemedView style={tw`flex-row items-center justify-between mb-4 `}>
            <ThemedText type="h3" style={tw`ml-3`}>
              {title || "Select an option"}
            </ThemedText>
            {/* <Pressable onPress={handleClose} hitSlop={8}> */}
            {/*   <Ionicons name="close" size={24} color={tw.color("gray-400")} /> */}
            {/* </Pressable> */}
          </ThemedView>

          {/* Search Input */}
          {isSearchable && (
            <View style={tw`mb-6  `}>
              <TextInput
                bottomSheet
                icon="search"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                leftIcon={
                  searchQuery.length > 0 ? (
                    <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                      <Ionicons name="close-circle" size={20} color="#9ca3af" />
                    </Pressable>
                  ) : null
                }
              />
            </View>
          )}

          {/* Options List */}
          {filteredOptions.length > 0 ? (
            <BottomSheetView style={tw`max-h-[60vh]`}>
              <BottomSheetFlatList
                style={tw`pb-6`}
                contentContainerStyle={tw`   rounded-xl gap-4`}
                data={filteredOptions}
                keyExtractor={(item: Option) => item.value.toString()}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }: { item: Option }) => (
                  <Pressable
                    onPress={() => handleSelect(item.value)}
                    style={({ pressed }) =>
                      tw.style(
                        "flex-row items-center justify-between p-6 rounded-3xl bg-light-surface",
                        item.value === value &&
                          "bg-light-secondary dark:bg-primary-900",
                        pressed && "bg-gray-100 dark:bg-gray-700",
                      )
                    }
                  >
                    <ThemedText
                      type="body1"
                      style={{
                        fontFamily:
                          value === item.value
                            ? typography.bold
                            : typography.medium,
                        color:
                          value === item.value
                            ? tw.color("light-on-secondary")
                            : tw.color(""),
                      }}
                    >
                      {item.label}
                    </ThemedText>
                    {value === item.value && (
                      <Ionicons
                        name="checkmark"
                        size={22}
                        color={tw.color("light-on-secondary")}
                      />
                    )}
                  </Pressable>
                )}
              />
            </BottomSheetView>
          ) : (
            <View style={tw`py-12 items-center`}>
              <Ionicons name="search-outline" size={48} color="#d1d5db" />
              <Text style={tw`text-gray-400 mt-3 text-base`}>
                No results found
              </Text>
              {searchQuery && (
                <Text style={tw`text-gray-400 text-sm mt-1`}>
                  Try a different search term
                </Text>
              )}
            </View>
          )}
          <View style={tw`h-4`} />
        </BottomSheetView>
      </ThemedBottomSheetModal>
    );
  },
);

BottomSheetPicker.displayName = "BottomSheetPicker";

export default BottomSheetPicker;
