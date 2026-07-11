import React, { useState, useMemo, useCallback, forwardRef, useImperativeHandle } from "react";
import { Pressable, Text, View } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetFlatList,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import tw from "../lib/tailwind";
import TextInput from "./text-input";

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

const BottomSheetPicker = forwardRef<BottomSheetPickerRef, BottomSheetPickerProps>(
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
    const bottomSheetModalRef = React.useRef<BottomSheetModal>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const animationConfigs = useBottomSheetSpringConfigs({
      damping: 50,
      stiffness: 300,
      mass: 1,
      overshootClamping: true,
    });

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
      >
        <BottomSheetView style={tw`flex-1 px-4 pb-4`}>
          {/* Header */}
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text
              style={tw`text-lg font-semibold text-gray-900 dark:text-white`}
            >
              {title || "Select an option"}
            </Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={tw.color("gray-400")} />
            </Pressable>
          </View>
        </BottomSheetView>

        {/* Search Input */}
        {isSearchable && (
          <View style={tw`mb-6 mt-12 px-4`}>
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
          <BottomSheetFlatList
            style={tw`pb-6`}
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
                <Text
                  style={tw.style(
                    "text-base text-gray-900 dark:text-white",
                    value === item.value && "font-semibold",
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
        <View style={tw`h-4`} />
      </BottomSheetModal>
    );
  },
);

BottomSheetPicker.displayName = "BottomSheetPicker";

export default BottomSheetPicker;
