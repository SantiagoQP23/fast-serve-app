import { useRef, useState } from "react";
import { ScrollView, RefreshControl, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";

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
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import InviteStaffBottomSheet from "@/presentation/users/components/invite-staff-bottom-sheet";
import ChangeUserRoleBottomSheet from "@/presentation/users/components/change-user-role-bottom-sheet";
import { useRemoveUser } from "@/presentation/users/hooks/useRemoveUser";
import { User } from "@/core/auth/models/user.model";

export default function StaffScreen() {
  const { t } = useTranslation("auth");
  const { user: currentUser, currentRestaurant } = useAuthStore();
  const { users, isLoading, refetch } = useUsers();
  const { removeUser } = useRemoveUser();

  const inviteBottomSheetRef = useRef<BottomSheetMethods>(null);
  const changeRoleBottomSheetRef = useRef<BottomSheetMethods>(null);
  const [selectedStaffMember, setSelectedStaffMember] = useState<User | null>(
    null,
  );
  const [userToRemove, setUserToRemove] = useState<User | null>(null);

  const staffMembers = users.filter((u) => u.id !== currentUser?.id);

  const handlePresentInvite = () => {
    inviteBottomSheetRef.current?.present();
  };

  const closeInviteBottomSheet = () => {
    inviteBottomSheetRef.current?.close();
  };

  const handlePresentChangeRole = (staffMember: User) => {
    setSelectedStaffMember(staffMember);
    changeRoleBottomSheetRef.current?.present();
  };

  const closeChangeRoleBottomSheet = () => {
    changeRoleBottomSheetRef.current?.close();
  };

  const handleRequestRemove = (staffMember: User) => {
    closeChangeRoleBottomSheet();
    setUserToRemove(staffMember);
  };

  const handleCancelRemove = () => {
    setUserToRemove(null);
  };

  const handleConfirmRemove = () => {
    if (!userToRemove) return;

    removeUser.mutate(userToRemove.id, {
      onSuccess: () => {
        setUserToRemove(null);
        refetch();
      },
    });
  };

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
            <Card
              key={staffMember.id}
              style={tw`gap-3 flex-row items-center`}
              onPress={() => handlePresentChangeRole(staffMember)}
            >
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
                {/* <ThemedText type="small" style={tw`text-gray-500`}> */}
                {/*   {staffMember.email} */}
                {/* </ThemedText> */}
              </ThemedView>
            </Card>
          ))}
        </ThemedView>
      </ScrollView>

      <ThemedView style={tw`pb-6`}>
        <Button
          label={t("staff.addUser")}
          onPress={handlePresentInvite}
          leftIcon="add-circle-outline"
        />
      </ThemedView>

      <ThemedBottomSheetModal ref={inviteBottomSheetRef} enablePanDownToClose>
        <InviteStaffBottomSheet
          existingUserIds={users.map((u) => u.id)}
          onClose={closeInviteBottomSheet}
          onInvited={refetch}
        />
      </ThemedBottomSheetModal>

      <ThemedBottomSheetModal
        ref={changeRoleBottomSheetRef}
        enablePanDownToClose
      >
        <ChangeUserRoleBottomSheet
          user={selectedStaffMember}
          onClose={closeChangeRoleBottomSheet}
          onRoleChanged={refetch}
          onRequestRemove={handleRequestRemove}
        />
      </ThemedBottomSheetModal>

      <DialogModal
        visible={!!userToRemove}
        title={t("staff.removeUser.confirmTitle")}
        message={t("staff.removeUser.confirmMessage", {
          name: `${userToRemove?.person?.firstName ?? ""} ${
            userToRemove?.person?.lastName ?? ""
          }`,
        })}
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
        confirmLabel={t("staff.removeUser.confirm")}
        cancelLabel={t("staff.removeUser.cancel")}
        confirmVariant="destructive"
        loading={removeUser.isPending}
      />
    </ScreenLayout>
  );
}
