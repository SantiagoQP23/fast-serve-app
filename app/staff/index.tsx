import { ScrollView, RefreshControl, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import tw from "@/presentation/theme/lib/tailwind";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useUsers } from "@/presentation/users/hooks/useUsers";

import Button from "@/presentation/theme/components/button";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";

export default function StaffScreen() {
  const { user: currentUser } = useAuthStore();
  const { users, isLoading, refetch } = useUsers();

  const staffMembers = users.filter(
    (u) => u.id !== currentUser?.id,
  );

  return (
    <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
      <ThemedView style={tw`flex-row items-center gap-3 mb-4`}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={24} />
        </Pressable>
        <ThemedText type="h2">Personal</ThemedText>
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        contentContainerStyle={tw`pb-8`}
      >
        <ThemedView style={tw`rounded-lg p-4 gap-4`}>
          {staffMembers.length === 0 && !isLoading && (
            <ThemedView style={tw`items-center py-12 gap-3`}>
              <Ionicons
                name="people-outline"
                size={48}
                color={tw.color("gray-400")}
              />
              <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
                No hay personal registrado en este restaurante.
              </ThemedText>
            </ThemedView>
          )}

          {staffMembers.map((staffMember) => (
            <ThemedView
              key={staffMember.id}
              style={tw`flex-row items-center gap-3 p-4 border border-light-border rounded-2xl`}
            >
              <Ionicons
                name="person-circle-outline"
                size={40}
                color={tw.color("gray-400")}
              />
              <ThemedView style={tw`flex-1`}>
                <ThemedText type="body1" style={tw`font-medium`}>
                  {staffMember.person?.firstName} {staffMember.person?.lastName}
                </ThemedText>
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {staffMember.person?.email}
                </ThemedText>
                <ThemedText type="small" style={tw`text-light-primary`}>
                  {staffMember.role?.description || staffMember.role?.name || ""}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          ))}
        </ThemedView>
      </ScrollView>

      <ThemedView style={tw`pb-6`}>
        <Button
          label="Agregar usuario"
          onPress={() => router.push("/scan-qr-invite")}
          leftIcon="add-circle-outline"
        />
      </ThemedView>
    </ScreenLayout>
  );
}
