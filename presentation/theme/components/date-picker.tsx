import { useState } from "react";
import { Pressable, View, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "@/presentation/theme/components/icon";
import { ThemedView } from "./themed-view";
import { ThemedText } from "./themed-text";
import tw from "../lib/tailwind";
import { formatDate, getRelativeDate } from "@/core/i18n/utils";
import dayjs from "dayjs";
import Button from "./button";
import { typography, isDarkTheme } from "@/constants/theme";
import { useThemeStore } from "@/presentation/theme/store/useThemeStore";

const CONTAINER_HEIGHT = 56;
const LABEL_FLOAT_POSITION = 9;
const LABEL_FLOAT_SIZE = 11;
const VALUE_MARGIN_TOP = 25;
const PADDING_HORIZONTAL = 12;
const BORDER_WIDTH = 1;
const FOCUSED_BORDER_WIDTH = 2;

type DatePickerProps = {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  maxDate?: Date;
  minDate?: Date;
  showTodayButton?: boolean;
  variant?: "filled" | "outlined";
};

export default function DatePicker({
  label,
  value,
  onChange,
  maxDate = new Date(), // Default to today as max date
  minDate,
  showTodayButton = true,
  variant = "outlined",
}: DatePickerProps) {
  const [show, setShow] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const theme = useThemeStore((s) => s.theme);

  const handleChange = (_event: unknown, selectedDate?: Date) => {
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
  const showDateCaption = !isToday && displayText !== formatDate(value);

  // Open reads as focused, like TextInput
  const isActive = isPressed || show;

  const labelColor = isActive ? tw.color("primary") : tw.color("gray-500");

  const borderColor =
    isActive || variant === "outlined" ? tw.color("primary") : "transparent";

  const borderWidth =
    variant === "outlined"
      ? isActive
        ? FOCUSED_BORDER_WIDTH
        : BORDER_WIDTH
      : 0;
  // Takes the extra focused border out of the padding so the text and label
  // don't shift when the border thickens.
  const borderInset = Math.max(borderWidth - BORDER_WIDTH, 0);

  return (
    <ThemedView style={tw`w-full`}>
      <Pressable
        onPress={handleOpen}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}: ${displayText}` : displayText}
        style={[
          tw.style(
            "flex-row rounded-md",
            variant === "filled" ? "bg-surface-high" : "bg-transparent",
          ),
          {
            minHeight: CONTAINER_HEIGHT,
            paddingHorizontal: PADDING_HORIZONTAL - borderInset,
            borderWidth,
            borderColor,
          },
        ]}
      >
        <View
          style={[
            tw`flex-1`,
            {
              alignSelf: "stretch",
              justifyContent: label ? "flex-start" : "center",
              marginVertical: -borderInset,
            },
          ]}
        >
          {label && (
            <ThemedText
              numberOfLines={1}
              style={{
                position: "absolute",
                left: 4,
                right: 0,
                top: LABEL_FLOAT_POSITION,
                fontSize: LABEL_FLOAT_SIZE,
                fontFamily: typography.medium,
                color: labelColor,
                includeFontPadding: false,
              }}
            >
              {label}
            </ThemedText>
          )}
          <ThemedText
            numberOfLines={1}
            style={{
              fontSize: 16,
              fontFamily: typography.medium,
              marginTop: label ? VALUE_MARGIN_TOP : 0,
              marginLeft: 4,
              includeFontPadding: false,
              color: tw.color("text"),
            }}
          >
            {displayText}
            {showDateCaption && (
              <ThemedText
                style={{
                  fontSize: 14,
                  fontFamily: typography.medium,
                  color: tw.color("on-surface-variant"),
                }}
              >
                {`  ${formatDate(value)}`}
              </ThemedText>
            )}
          </ThemedText>
        </View>
        <Icon
          name="calendar"
          size={18}
          style={{ marginLeft: 8, alignSelf: "center" }}
          color={tw.color("on-surface-variant")}
        />
      </Pressable>

      {/* iOS renders inline picker */}
      {show && Platform.OS === "ios" && (
        <ThemedView
          style={tw`mt-2 rounded-md border border-outline-variant overflow-hidden`}
        >
          <DateTimePicker
            value={value}
            mode="date"
            display="inline"
            onChange={handleChange}
            maximumDate={maxDate}
            minimumDate={minDate}
            themeVariant={isDarkTheme(theme) ? "dark" : "light"}
            accentColor={tw.color("primary")}
          />

          {/* Action buttons for iOS */}
          <View
            style={tw`flex-row gap-2 p-3 border-t border-outline-variant`}
          >
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
          accentColor={tw.color("primary")}
        />
      )}
    </ThemedView>
  );
}
