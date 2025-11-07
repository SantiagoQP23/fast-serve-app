import {
  Platform,
  StyleSheet,
  ScrollView,
  Text,
  Pressable,
} from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import OrderCard from "@/presentation/home/components/order-card";
import { Ionicons } from "@expo/vector-icons";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { useState } from "react";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

export default function OrdersScreen() {
  const [visible, setVisible] = useState(false);
  const { logout } = useAuthStore();
  return (
    <ThemedView style={tw`px-4 pt-8 flex-1 gap-4`}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Profile</ThemedText>
      </ThemedView>
      <ThemedView style={tw`my-4`} />
      <ThemedView>
        <ThemedText style={tw`text-2xl font-bold`}>
          Santiago Quirumbay
        </ThemedText>
        <ThemedText style={tw`text-sm text-gray-500`}>Administrator</ThemedText>
      </ThemedView>
      <ThemedView style={tw`mt-8`}>
        <ThemedView
          style={tw`rounded-lg bg-gray-100 dark:bg-gray-800 p-4 gap-6`}
        >
          <Pressable
            style={({ pressed }) =>
              tw.style(`flex-row items-center gap-4`, pressed && "opacity-70")
            }
            onPress={() => {}}
          >
            <Ionicons name="person-outline" size={24} />
            <ThemedText style={tw`font-medium`}>My profile</ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) =>
              tw.style(`flex-row items-center gap-4`, pressed && "opacity-70")
            }
            onPress={() => {}}
          >
            <Ionicons name="settings-outline" size={24} />
            <ThemedText style={tw`font-medium`}>Settings</ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) =>
              tw.style(`flex-row items-center gap-4`, pressed && "opacity-70")
            }
            onPress={() => {
              setVisible(true);
            }}
          >
            <Ionicons name="log-out-outline" size={24} color="red" />
            <ThemedText style={tw`font-medium`}>Log out</ThemedText>
          </Pressable>
        </ThemedView>
        <DialogModal
          visible={visible}
          title="Log out"
          message="Are you sure you want to log out?"
          onCancel={() => setVisible(false)}
          onConfirm={() => {
            logout();
            console.log("Confirmed!");
            setVisible(false);
          }}
        />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
