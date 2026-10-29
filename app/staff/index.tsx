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
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import InviteStaffBottomSheet from "@/presentation/users/components/invite-staff-bottom-sheet";
import StaffMemberBottomSheet, {
  type StaffMemberBottomSheetRef,
} from "@/presentation/users/components/staff-member-bottom-sheet";
import { useRemoveUser } from "@/presentation/users/hooks/useRemoveUser";
import { Roles, User } from "@/core/auth/models/user.model";
import Button from "@/presentation/theme/components/button";
import DetailHeader from "@/presentation/theme/components/detail-header";
import {
  DetailCard,
  DetailSectionTitle,
} from "@/presentation/theme/components/detail-card";

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
  const staffMemberSheetRef = useRef<StaffMemberBottomSheetRef>(null);
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

  const handlePresentStaffMember = (staffMember: User) => {
    setSelectedStaffMember(staffMember);
    staffMemberSheetRef.current?.present();
  };

  const handleRequestRemove = (staffMember: User) => {
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
    <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
      <ThemedView style={tw`items-center flex-row mb-6`}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t("common:actions.goBack")}
          hitSlop={12}
          style={({ pressed }) => tw.style(pressed && "opacity-70")}
        >
          <Icon name="arrow-left" color={tw.color("on-surface")} size={24} />
        </Pressable>
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-4 pb-8`}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={tw.color("primary")}
            colors={[tw.color("primary") as string]}
          />
        }
      >
        <DetailHeader title={t("staff.title")} subtitle={t("staff.subtitle")}>
          <ThemedView style={tw`flex-row flex-wrap gap-3`}>
            <Button
              label={t("staff.addUser")}
              leftIcon="user-plus"
              shape="rounded"
              size="small"
              onPress={handlePresentInvite}
            />
          </ThemedView>
        </DetailHeader>

        {staffMembers.length === 0 && !isLoading && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="users" size={48} color={tw.color("gray-400")} />
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {t("staff.empty")}
            </ThemedText>
          </ThemedView>
        )}

        {staffGroups.map((group) => (
          <ThemedView key={group.key} style={tw`gap-3 mt-4`}>
            <DetailSectionTitle
              title={group.title}
              action={
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {group.members.length}
                </ThemedText>
              }
            />
            <DetailCard style={tw`py-2`}>
              {group.members.map((staffMember, index) => (
                <Pressable
                  key={staffMember.id}
                  onPress={() => handlePresentStaffMember(staffMember)}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    tw`flex-row items-center gap-3 py-3`,
                    index < group.members.length - 1 &&
                      tw`border-b border-divider`,
                    pressed && tw`opacity-60`,
                  ]}
                >
                  <Avatar
                    name={staffMember.person?.firstName}
                    size={40}
                    variant="surface"
                  />
                  <ThemedText style={tw`flex-1`} numberOfLines={1}>
                    {staffMember.person?.firstName}{" "}
                    {staffMember.person?.lastName}
                  </ThemedText>
                </Pressable>
              ))}
            </DetailCard>
          </ThemedView>
        ))}
      </ScrollView>

      <ThemedBottomSheetModal ref={inviteBottomSheetRef} enablePanDownToClose>
        <InviteStaffBottomSheet
          existingUserIds={users.map((u) => u.id)}
          onClose={closeInviteBottomSheet}
          onInvited={refetch}
        />
      </ThemedBottomSheetModal>

      <StaffMemberBottomSheet
        ref={staffMemberSheetRef}
        user={selectedStaffMember}
        onRoleChanged={refetch}
        onRequestRemove={handleRequestRemove}
      />

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
