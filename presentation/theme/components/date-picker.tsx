import React, { useState } from "react";
import { Pressable, View, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "./themed-view";
import { ThemedText } from "./themed-text";
import tw from "../lib/tailwind";
import { formatDate, getRelativeDate } from "@/core/i18n/utils";
import dayjs from "dayjs";
import Button from "./button";

type DatePickerProps = {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  maxDate?: Date;
  minDate?: Date;
  showTodayButton?: boolean;
};

export default function DatePicker({
  label,
  value,
  onChange,
  maxDate = new Date(), // Default to today as max date
  minDate,
  showTodayButton = true,
}: DatePickerProps) {
  const [show, setShow] = useState(false);

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShow(false);
    }
    
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const handleOpen = () => {
    setShow(true);
  };

  const handleClose = () => {
    setShow(false);
  };

  const handleToday = () => {
    onChange(new Date());
    setShow(false);
  };

  const isToday = dayjs(value).isSame(dayjs(), "day");
  const displayText = getRelativeDate(value);

  return (
    <View style={tw`w-full`}>
      {label && (
        <ThemedText type="small" style={tw`text-gray-600 mb-2 font-semibold`}>
          {label}
        </ThemedText>
      )}

      <Pressable
        onPress={handleOpen}
        style={tw`border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 flex-row justify-between items-center`}
      >
        <View style={tw`flex-row items-center gap-2`}>
          <Ionicons
            name="calendar-outline"
            size={20}
            color={tw.color("primary-600")}
          />
          <ThemedText type="body1" style={tw`font-medium`}>
            {displayText}
          </ThemedText>
          {!isToday && (
            <ThemedText type="caption" style={tw`text-gray-500`}>
              ({formatDate(value)})
            </ThemedText>
          )}
        </View>
        <Ionicons name="chevron-down" size={20} color="#9ca3af" />
      </Pressable>

      {/* iOS renders inline picker */}
      {show && Platform.OS === "ios" && (
        <ThemedView style={tw`mt-2 rounded-2xl border border-gray-300 dark:border-gray-700 overflow-hidden`}>
          <DateTimePicker
            value={value}
            mode="date"
            display="inline"
            onChange={handleChange}
            maximumDate={maxDate}
            minimumDate={minDate}
            themeVariant="light"
          />
          
          {/* Action buttons for iOS */}
          <View style={tw`flex-row gap-2 p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700`}>
            {showTodayButton && !isToday && (
              <View style={tw`flex-1`}>
                <Button
                  label="Today"
                  onPress={handleToday}
                  variant="outline"
                  size="small"
                />
              </View>
            )}
            <View style={tw`flex-1`}>
              <Button
                label="Done"
                onPress={handleClose}
                variant="primary"
                size="small"
              />
            </View>
          </View>
        </ThemedView>
      )}

      {/* Android renders modal picker */}
      {show && Platform.OS === "android" && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          onChange={handleChange}
          maximumDate={maxDate}
          minimumDate={minDate}
        />
      )}
    </View>
  );
}
