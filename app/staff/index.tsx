import { ScrollView, RefreshControl, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import tw from "@/presentation/theme/lib/tailwind";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useUsers } from "@/presentation/users/hooks/useUsers";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { translateRole } from "@/core/i18n/utils";

import Button from "@/presentation/theme/components/button";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Card from "@/presentation/theme/components/card";
import { typography } from "@/constants/theme";

export default function StaffScreen() {
  const { t } = useTranslation("auth");
  const { user: currentUser, currentRestaurant } = useAuthStore();
  const { users, isLoading, refetch } = useUsers();

  const staffMembers = users.filter((u) => u.id !== currentUser?.id);

  const getRoleName = (staffMember: (typeof staffMembers)[number]) => {
    const role = staffMember.restaurantRoles.find(
      (resRole) => resRole.restaurant.id === currentRestaurant?.id,
    )?.role;

    return role ? translateRole(role.name) : "";
  };

  return (
    <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
      <ThemedView style={tw`flex-row items-center gap-3 mb-4`}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={24} />
        </Pressable>
        <ThemedText type="h2">{t("staff.title")}</ThemedText>
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        contentContainerStyle={tw`pb-8`}
      >
        <ThemedView style={tw`rounded-lg  gap-2`}>
          {staffMembers.length === 0 && !isLoading && (
            <ThemedView style={tw`items-center py-12 gap-3`}>
              <Ionicons
                name="people-outline"
                size={48}
                color={tw.color("gray-400")}
              />
              <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
                {t("staff.empty")}
              </ThemedText>
            </ThemedView>
          )}

          {staffMembers.map((staffMember) => (
            <Card key={staffMember.id} style={tw`gap-3 flex-row`}>
              <Ionicons
                name="person-circle-outline"
                size={40}
                color={tw.color("gray-400")}
              />
              <ThemedView style={tw`flex-1 gap-1`}>
                <ThemedText type="body1" style={tw``}>
                  {staffMember.person?.firstName} {staffMember.person?.lastName}
                </ThemedText>
                <ThemedText
                  type="body2"
                  style={[
                    tw`text-light-primary`,
                    { fontFamily: typography.medium },
                  ]}
                >
                  {getRoleName(staffMember) || ""}
                </ThemedText>
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {staffMember.email}
                </ThemedText>
              </ThemedView>
            </Card>
          ))}
        </ThemedView>
      </ScrollView>

      <ThemedView style={tw`pb-6`}>
        <Button
          label={t("staff.addUser")}
          onPress={() => router.push("/scan-qr-invite")}
          leftIcon="add-circle-outline"
        />
      </ThemedView>
    </ScreenLayout>
  );
}
