import React, { useState, useRef, useMemo, useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetFlatList,
  BottomSheetTextInput,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import tw from "../lib/tailwind";

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
  snapPoints = ["40%", "70%"],
}: SelectProps) {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Animation config for smooth, iOS-like bottom sheet animations
  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 50,
    stiffness: 300,
    mass: 1,
    overshootClamping: true,
  });

  // Smart default: enable search if more than 5 options, or if explicitly set
  const isSearchable = searchable !== undefined ? searchable : options.length > 5;

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
    [onChange]
  );

  const handleClose = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  return (
    <>
      {/* Trigger Button */}
      <View style={tw`w-full`}>
        {label && (
          <Text style={tw`text-gray-700 dark:text-gray-300 mb-2 font-semibold`}>
            {label}
          </Text>
        )}

        <Pressable
          onPress={handleOpen}
          style={tw`border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 flex-row justify-between items-center`}
        >
          <Text
            style={tw.style(
              selectedOption ? "text-gray-900 dark:text-white" : "text-gray-400"
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#9ca3af" />
        </Pressable>
      </View>

      {/* Bottom Sheet Modal */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        animationConfigs={animationConfigs}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
        enablePanDownToClose
      >
        <BottomSheetView style={tw`flex-1 px-4 pb-4`}>
          {/* Header */}
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text style={tw`text-lg font-semibold text-gray-900 dark:text-white`}>
              {label || "Select an option"}
            </Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={tw.color("gray-600")} />
            </Pressable>
          </View>

          {/* Search Input */}
          {isSearchable && (
            <View style={tw`mb-3`}>
              <View
                style={tw`flex-row items-center border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-800`}
              >
                <Ionicons
                  name="search"
                  size={20}
                  color="#9ca3af"
                  style={tw`mr-2`}
                />
                <BottomSheetTextInput
                  style={tw`flex-1 text-gray-900 dark:text-white text-base`}
                  placeholder={searchPlaceholder}
                  placeholderTextColor="#9ca3af"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                    <Ionicons name="close-circle" size={20} color="#9ca3af" />
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* Options List */}
          {filteredOptions.length > 0 ? (
            <BottomSheetFlatList
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
                      pressed && "bg-gray-100 dark:bg-gray-700"
                    )
                  }
                >
                  <Text
                    style={tw.style(
                      "text-base text-gray-900 dark:text-white",
                      value === item.value && "font-semibold"
                    )}
                  >
                    {item.label}
                  </Text>
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
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}
