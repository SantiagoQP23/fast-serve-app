import React, { useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from "react-native";
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
};

export default function Select({
  label,
  options,
  value,
  placeholder = "Select an option",
  onChange,
}: SelectProps) {
  const [open, setOpen] = useState(false);

  // find selected option to display its label
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <View style={tw`w-full`}>
      {label && (
        <Text style={tw`text-gray-700 dark:text-gray-300 mb-2 font-semibold`}>
          {label}
        </Text>
      )}

      <Pressable
        onPress={() => setOpen(true)}
        style={tw`border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 flex-row justify-between items-center`}
      >
        <Text
          style={tw.style(
            selectedOption ? "text-gray-900 dark:text-white" : "text-gray-400",
          )}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#9ca3af" />
      </Pressable>

      {/* Modal Dropdown */}
      <Modal transparent visible={open} animationType="fade">
        <Pressable
          style={tw`flex-1 bg-black/30 justify-center items-center`}
          onPress={() => setOpen(false)}
        >
          <View
            style={tw`bg-white dark:bg-gray-900 w-72 rounded-2xl p-4 shadow-lg`}
          >
            <FlatList
              data={options}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={tw`py-3 px-2 rounded-xl ${
                    value === item.value ? "bg-primary/10" : ""
                  }`}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={tw.style(
                      value === item.value
                        ? "text-primary font-semibold"
                        : "text-gray-800 dark:text-gray-200",
                    )}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
