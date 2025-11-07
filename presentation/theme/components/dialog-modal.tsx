import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  GestureResponderEvent,
} from "react-native";
import tw from "../lib/tailwind";

interface DialogModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  onConfirm?: (event: GestureResponderEvent) => void;
  onCancel?: (event: GestureResponderEvent) => void;
  confirmText?: string;
  cancelText?: string;
}

export default function DialogModal({
  visible,
  title = "Confirm",
  message = "Are you sure?",
  onConfirm,
  onCancel,
  confirmText = "OK",
  cancelText = "Cancel",
}: DialogModalProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      {/* Backdrop */}
      <View style={tw`flex-1 bg-black/50 items-center justify-center`}>
        {/* Modal card */}
        <View style={tw`bg-white rounded-2xl w-4/5 p-5 shadow-lg`}>
          {title && (
            <Text style={tw`text-lg font-semibold text-gray-800 mb-2`}>
              {title}
            </Text>
          )}
          {message && <Text style={tw`text-gray-600 mb-4`}>{message}</Text>}
          <View style={tw`flex-row justify-end`}>
            <Pressable onPress={onCancel} style={tw`mr-4`}>
              <Text style={tw`text-gray-500 font-medium`}>{cancelText}</Text>
            </Pressable>
            <Pressable onPress={onConfirm}>
              <Text style={tw`text-blue-600 font-semibold`}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
