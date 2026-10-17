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
import Ionicons from "@react-native-vector-icons/ionicons/static";
import tw from "../lib/tailwind";
import TextInput from "./text-input";
import Button from "./button";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "./themed-text";
import { typography } from "@/constants/theme";
import { ThemedView } from "./themed-view";

export type Option = {
  label: string;
  value: string | number;
  /** Encabezado de grupo; se muestra cuando cambia respecto a la opción anterior. */
  group?: string;
};

export type BottomSheetPickerAction = {
  label: string;
  onPress: () => void;
};

type BottomSheetPickerProps = {
  title?: string;
  options: Option[];
  value?: string | number;
  onChange: (value: string | number) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  snapPoints?: string[];
  headerAction?: BottomSheetPickerAction;
  footerAction?: BottomSheetPickerAction;
  /** Called once the sheet has fully closed. */
  onDismiss?: () => void;
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
      headerAction,
      footerAction,
      onDismiss,
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

    const handleHeaderAction = useCallback(() => {
      bottomSheetModalRef.current?.dismiss();
      headerAction?.onPress();
    }, [headerAction]);

    const handleFooterAction = useCallback(() => {
      bottomSheetModalRef.current?.dismiss();
      footerAction?.onPress();
    }, [footerAction]);

    const filteredOptions = useMemo(() => {
      if (!searchQuery.trim()) return options;
      return options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }, [options, searchQuery]);

    return (
      <ThemedBottomSheetModal
        ref={bottomSheetModalRef}
        enablePanDownToClose
        onDismiss={onDismiss}
      >
        <BottomSheetView style={tw` px-4 `}>
          {/* Header */}
          <ThemedView style={tw`mb-4`}>
            <ThemedText
              type="h2"
              style={[tw`ml-3`, { fontFamily: typography.regular }]}
              numberOfLines={1}
            >
              {title || "Select an option"}
            </ThemedText>
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
                trailingIcon={
                  searchQuery.length > 0 ? (
                    <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color={tw.color("gray-400")}
                      />
                    </Pressable>
                  ) : null
                }
              />
            </View>
          )}

          {headerAction && (
            <ThemedView style={tw`flex-row mb-2`}>
              <Button
                leftIcon="add"
                label={headerAction.label}
                variant={
                  value !== undefined && value !== "" ? "outline" : "secondary"
                }
                onPress={handleHeaderAction}
              />
            </ThemedView>
          )}

          {/* Options List */}
          {filteredOptions.length > 0 ? (
            <BottomSheetView style={tw`max-h-[60vh]`}>
              <BottomSheetFlatList
                style={tw`pb-6`}
                contentContainerStyle={tw`   rounded-xl gap-2`}
                data={filteredOptions}
                keyExtractor={(item: Option) => item.value.toString()}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                renderItem={({
                  item,
                  index,
                }: {
                  item: Option;
                  index: number;
                }) => (
                  <View style={tw`gap-4`}>
                    {!!item.group &&
                      item.group !== filteredOptions[index - 1]?.group && (
                        <ThemedText
                          type="small"
                          style={tw.style(
                            "text-gray-500 px-2",
                            index > 0 && "pt-2",
                          )}
                        >
                          {item.group}
                        </ThemedText>
                      )}
                    <Pressable
                      onPress={() => handleSelect(item.value)}
                      style={({ pressed }) =>
                        tw.style(
                          "flex-row items-center justify-between p-6 rounded-3xl bg-surface",
                          item.value === value && "bg-secondary ",
                          pressed && "bg-gray-100 ",
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
                              ? tw.color("on-secondary")
                              : tw.color("on-surface"),
                        }}
                      >
                        {item.label}
                      </ThemedText>
                      {value === item.value && (
                        <Ionicons
                          name="checkmark"
                          size={22}
                          color={tw.color("on-secondary")}
                        />
                      )}
                    </Pressable>
                  </View>
                )}
              />
            </BottomSheetView>
          ) : (
            <View style={tw`py-12 items-center`}>
              <Ionicons
                name="search-outline"
                size={48}
                color={tw.color("gray-300")}
              />
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

          {footerAction && (
            <View style={tw`mt-2 mb-4`}>
              <Button
                label={footerAction.label}
                variant="outline"
                onPress={handleFooterAction}
              />
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
