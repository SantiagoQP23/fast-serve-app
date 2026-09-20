import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { BottomSheetView } from "@expo/ui/community/bottom-sheet";

import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { Roles, User } from "@/core/auth/models/user.model";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Select from "@/presentation/theme/components/select";
import Button from "@/presentation/theme/components/button";

import { useRoles } from "@/presentation/auth/hooks/useRoles";
import { useUpdateUserRole } from "@/presentation/users/hooks/useUpdateUserRole";
import { useRemoveUser } from "@/presentation/users/hooks/useRemoveUser";

interface ChangeUserRoleBottomSheetProps {
  user: User | null;
  onClose?: () => void;
  onRoleChanged?: () => void;
  onRemoved?: () => void;
}

const ChangeUserRoleBottomSheet = ({
  user,
  onClose,
  onRoleChanged,
  onRemoved,
}: ChangeUserRoleBottomSheetProps) => {
  const { t } = useTranslation("auth");
  const { currentRestaurant } = useAuthStore();
  const { roles } = useRoles();
  const { updateRole } = useUpdateUserRole();
  const { removeUser } = useRemoveUser();

  const currentRoleId = user?.restaurantRoles.find(
    (resRole) => resRole.restaurant.id === currentRestaurant?.id,
  )?.role.id;

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(
    currentRoleId ?? null,
  );

  useEffect(() => {
    setSelectedRoleId(currentRoleId ?? null);
  }, [currentRoleId]);

  if (!user) return null;

  const hasChanges = selectedRoleId !== currentRoleId;

  const handleSave = () => {
    if (!selectedRoleId) return;

    updateRole.mutate(
      { userId: user.id, roleId: selectedRoleId },
      {
        onSuccess: () => {
          onRoleChanged?.();
          onClose?.();
        },
      },
    );
  };

  const handleRemove = () => {
    Alert.alert(
      t("staff.removeUser.confirmTitle"),
      t("staff.removeUser.confirmMessage", {
        name: `${user.person?.firstName} ${user.person?.lastName}`,
      }),
      [
        { text: t("staff.removeUser.cancel"), style: "cancel" },
        {
          text: t("staff.removeUser.confirm"),
          style: "destructive",
          onPress: () => {
            removeUser.mutate(user.id, {
              onSuccess: () => {
                onRemoved?.();
                onClose?.();
              },
            });
          },
        },
      ],
    );
  };

  return (
    <BottomSheetView style={tw`px-4 pb-6 gap-4`}>
      <ThemedView style={tw`mb-1`}>
        <ThemedText type="h3">{t("staff.changeRole.title")}</ThemedText>
        <ThemedText type="body2" style={tw`text-gray-500 mt-1`}>
          {user.person?.firstName} {user.person?.lastName} · @{user.username}
        </ThemedText>
      </ThemedView>

      <Select
        label={t("staff.changeRole.roleLabel")}
        placeholder={t("staff.invite.rolePlaceholder")}
        options={roles
          .filter((role) => role.name !== Roles.OWNER)
          .map((role) => ({
            value: role.id,
            label: t(`roles.${role.name}`),
          }))}
        value={selectedRoleId ?? undefined}
        onChange={(value) => setSelectedRoleId(Number(value))}
      />

      <Button
        label={t("staff.changeRole.save")}
        onPress={handleSave}
        disabled={!selectedRoleId || !hasChanges || updateRole.isPending}
        loading={updateRole.isPending}
      />

      <Button
        label={t("staff.removeUser.title")}
        onPress={handleRemove}
        variant="destructive"
        leftIcon="trash-outline"
        disabled={removeUser.isPending}
        loading={removeUser.isPending}
      />
    </BottomSheetView>
  );
};

export default ChangeUserRoleBottomSheet;
