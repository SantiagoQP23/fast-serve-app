import { useRef, useState } from "react";
import { ScrollView, RefreshControl, Pressable } from "react-native";
import { router } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";

import tw from "@/presentation/theme/lib/tailwind";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useUsers } from "@/presentation/users/hooks/useUsers";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

import Avatar from "@/presentation/theme/components/avatar";
import IconButton from "@/presentation/theme/components/icon-button";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Card from "@/presentation/theme/components/card";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import InviteStaffBottomSheet from "@/presentation/users/components/invite-staff-bottom-sheet";
import ChangeUserRoleBottomSheet from "@/presentation/users/components/change-user-role-bottom-sheet";
import { useRemoveUser } from "@/presentation/users/hooks/useRemoveUser";
import { Roles, User } from "@/core/auth/models/user.model";
import Button from "@/presentation/theme/components/button";
import InventorySectionHeader from "@/presentation/inventory/components/inventory-section-header";

/** Order the role groups appear in, from most to least privileged. */
const ROLE_ORDER = [
  Roles.OWNER,
  Roles.ADMIN,
  Roles.CASHIER,
  Roles.WAITER,
  Roles.COOK,
];

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

  const getRole = (staffMember: User) =>
    staffMember.restaurantRoles.find(
      (resRole) => resRole.restaurant.id === currentRestaurant?.id,
    )?.role?.name;

  const staffGroups = [
    ...ROLE_ORDER.map((role) => ({
      key: role,
      title: t(`staff.groups.${role}`),
      members: staffMembers.filter((member) => getRole(member) === role),
    })),
    {
      key: "none",
      title: t("staff.groups.none"),
      members: staffMembers.filter((member) => {
        const role = getRole(member);
        return !role || !ROLE_ORDER.includes(role);
      }),
    },
  ].filter((group) => group.members.length > 0);

  return (
    <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
      <ThemedView style={tw`flex-row items-center gap-6 mb-4`}>
        <Pressable onPress={() => router.back()}>
          <Icon name="arrow-left" color={tw.color("on-surface")} size={24} />
        </Pressable>
        <ThemedText type="h3" style={tw`flex-1`}>
          {t("staff.title")}
        </ThemedText>
        <Button
          leftIcon="user-plus"
          label={t("staff.addUser")}
          onPress={handlePresentInvite}
          accessibilityLabel={t("staff.addUser")}
          variant="outline"
          size="extra-small"
        />
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        contentContainerStyle={tw`pb-8`}
      >
        <ThemedView style={tw`gap-8 px-2`}>
          {staffMembers.length === 0 && !isLoading && (
            <ThemedView style={tw`items-center py-12 gap-3`}>
              <Icon name="users" size={48} color={tw.color("gray-400")} />
              <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
                {t("staff.empty")}
              </ThemedText>
            </ThemedView>
          )}

          {staffGroups.map((group) => (
            <ThemedView key={group.key} style={tw`gap-4`}>
              <InventorySectionHeader
                title={group.title}
                count={group.members.length}
              />
              <ThemedView style={tw`gap-5`}>
                {group.members.map((staffMember) => (
                  <Pressable
                    key={staffMember.id}
                    style={tw`gap-4 flex-row items-center`}
                    onPress={() => handlePresentChangeRole(staffMember)}
                  >
                    <Avatar
                      name={staffMember.person?.firstName}
                      size={40}
                      variant="surface"
                    />
                    <ThemedText type="body1" style={tw`flex-1`}>
                      {staffMember.person?.firstName}{" "}
                      {staffMember.person?.lastName}
                    </ThemedText>
                  </Pressable>
                ))}
              </ThemedView>
            </ThemedView>
          ))}
        </ThemedView>
      </ScrollView>

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
