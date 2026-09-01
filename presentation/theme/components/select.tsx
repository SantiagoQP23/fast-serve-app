import React, { useState, useRef, useMemo, useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import {
  BottomSheetView,
  BottomSheetFlatList,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import tw from "../lib/tailwind";
import TextInput from "./text-input";
import { ThemedText } from "./themed-text";
import { typography } from "@/constants/theme";
import { ThemedView } from "./themed-view";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";

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
  const bottomSheetModalRef = useRef<BottomSheetMethods>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Smart default: enable search if more than 5 options, or if explicitly set
  const isSearchable =
    searchable !== undefined ? searchable : options.length > 5;

  // Find selected option to display its label
  const selectedOption = options.find((opt) => opt.value === value);

  const handleOpen = useCallback(() => {
    setSearchQuery(""); // Clear search when opening
    bottomSheetModalRef.current?.present();
  }, []);

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

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [options, searchQuery]);

  return (
    <>
      {/* Trigger Button */}
      <ThemedView style={tw`w-full gap-2`}>
        {label && (
          <ThemedText style={[tw` dark:text-gray-300  `]}>{label}</ThemedText>
        )}

        <Pressable
          onPress={handleOpen}
          style={tw` dark:border-gray-700 bg-white dark:bg-gray-800 rounded-3xl px-4 py-3 flex-row justify-between items-center bg-gray-100`}
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

      {/* Bottom Sheet Modal */}
      <ThemedBottomSheetModal
        ref={bottomSheetModalRef}
        enablePanDownToClose
        enableContentPanningGesture
      >
        <BottomSheetView style={tw`flex-1 px-4  bg-light-background`}>
          {/* Header */}
          <BottomSheetView style={tw`flex-row items-center justify-between `}>
            <Text style={tw`text-lg  text-gray-900 dark:text-white`}>
              {label || "Select an option"}
            </Text>
            {/* <Pressable onPress={handleClose} hitSlop={8}> */}
            {/*   <Ionicons name="close" size={24} color={tw.color("gray-400")} /> */}
            {/* </Pressable> */}
          </BottomSheetView>
        </BottomSheetView>

        {/* Search Input */}
        {isSearchable && (
          <ThemedView style={tw`mb-6 mt-4 px-4 bg-light-background`}>
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
          </ThemedView>
        )}

        {/* Options List */}
        {filteredOptions.length > 0 ? (
          <BottomSheetFlatList
            style={tw`pb-6 bg-light-background flex-1`}
            contentContainerStyle={tw`mx-4 bg-light-surface rounded-xl`}
            data={filteredOptions}
            keyExtractor={(item: Option) => item.value.toString()}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }: { item: Option }) => (
              <Pressable
                onPress={() => handleSelect(item.value)}
                style={({ pressed }) =>
                  tw.style(
                    "flex-row items-center justify-between py-3 px-3 rounded-xl",
                    pressed && "bg-gray-100 dark:bg-gray-700",
                  )
                }
              >
                <ThemedText
                  style={tw.style(
                    "text-base text-gray-900 dark:text-white",
                    value === item.value && "",
                  )}
                >
                  {item.label}
                </ThemedText>
                {value === item.value && (
                  <Ionicons
                    name="checkmark"
                    size={22}
                    color={tw.color("primary-600")}
                  />
                )}
              </Pressable>
            )}
          />
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
      </ThemedBottomSheetModal>
    </>
  );
}
