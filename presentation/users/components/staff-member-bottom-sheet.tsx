import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";

import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { Roles, User } from "@/core/auth/models/user.model";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

import Avatar from "@/presentation/theme/components/avatar";
import Button from "@/presentation/theme/components/button";
import InfoRow from "@/presentation/theme/components/info-row";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";

import { useRoles } from "@/presentation/auth/hooks/useRoles";
import { useUpdateUserRole } from "@/presentation/users/hooks/useUpdateUserRole";

interface StaffMemberBottomSheetProps {
  user: User | null;
  onRoleChanged?: () => void;
  onRequestRemove?: (user: User) => void;
}

export type StaffMemberBottomSheetRef = {
  present: () => void;
  dismiss: () => void;
};

/** A staff member's details, with the role editable in a stacked picker. */
const StaffMemberBottomSheet = forwardRef<
  StaffMemberBottomSheetRef,
  StaffMemberBottomSheetProps
>(({ user, onRoleChanged, onRequestRemove }, ref) => {
  const { t } = useTranslation("auth");
  const { currentRestaurant } = useAuthStore();
  const { roles } = useRoles();
  const { updateRole } = useUpdateUserRole();

  const sheetRef = useRef<BottomSheetMethods>(null);
  const rolePickerRef = useRef<BottomSheetPickerRef>(null);

  useImperativeHandle(ref, () => ({
    present: () => sheetRef.current?.present(),
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const currentRoleId = user?.restaurantRoles.find(
    (resRole) => resRole.restaurant.id === currentRestaurant?.id,
  )?.role.id;

  // Local snapshot so the row shows the new role right away.
  const [roleId, setRoleId] = useState<number | undefined>(currentRoleId);

  useEffect(() => {
    setRoleId(currentRoleId);
  }, [user?.id, currentRoleId]);

  const roleName = roles.find((role) => role.id === roleId)?.name;

  const handleRoleChange = (value: string | number) => {
    if (!user) return;
    const nextRoleId = Number(value);
    if (nextRoleId === roleId) return;

    const previousRoleId = roleId;
    setRoleId(nextRoleId);
    updateRole.mutate(
      { userId: user.id, roleId: nextRoleId },
      {
        onSuccess: () => onRoleChanged?.(),
        onError: () => setRoleId(previousRoleId),
      },
    );
  };

  const handleRemove = () => {
    if (!user) return;
    sheetRef.current?.dismiss();
    onRequestRemove?.(user);
  };

  const fullName = [user?.person?.firstName, user?.person?.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
        {user && (
          <ThemedView style={tw`px-6 py-4 gap-6`}>
            <ThemedView style={tw`flex-row items-center gap-4`}>
              <Avatar
                name={user.person?.firstName}
                size={56}
                variant="surface"
              />
              <ThemedView style={tw`flex-1 gap-0.5`}>
                <ThemedText
                  type="h3"
                  style={{ fontFamily: typography.medium }}
                  numberOfLines={1}
                >
                  {fullName || `@${user.username}`}
                </ThemedText>
                {!!fullName && (
                  <ThemedText
                    type="body2"
                    style={tw`text-gray-500`}
                    numberOfLines={1}
                  >
                    @{user.username}
                  </ThemedText>
                )}
                {!!user.email && (
                  <ThemedText
                    type="body2"
                    style={tw`text-gray-500`}
                    numberOfLines={1}
                  >
                    {user.email}
                  </ThemedText>
                )}
              </ThemedView>
            </ThemedView>

            <InfoRow
              label={t("staff.changeRole.roleLabel")}
              value={roleName ? t(`roles.${roleName}`) : undefined}
              placeholder={t("staff.groups.none")}
              onPress={() => rolePickerRef.current?.present()}
            />

            <Button
              label={t("staff.removeUser.title")}
              leftIcon="trash"
              variant="text"
              size="small"
              onPress={handleRemove}
            />
          </ThemedView>
        )}
      </ThemedBottomSheetModal>

      <BottomSheetPicker
        ref={rolePickerRef}
        title={t("staff.changeRole.title")}
        searchable={false}
        options={roles
          .filter((role) => role.name !== Roles.OWNER)
          .map((role) => ({
            value: role.id,
            label: t(`roles.${role.name}`),
          }))}
        value={roleId}
        onChange={handleRoleChange}
      />
    </>
  );
});

StaffMemberBottomSheet.displayName = "StaffMemberBottomSheet";

export default StaffMemberBottomSheet;
