import { useEffect, useState } from "react";
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

interface ChangeUserRoleBottomSheetProps {
  user: User | null;
  onClose?: () => void;
  onRoleChanged?: () => void;
  onRequestRemove?: (user: User) => void;
}

const ChangeUserRoleBottomSheet = ({
  user,
  onClose,
  onRoleChanged,
  onRequestRemove,
}: ChangeUserRoleBottomSheetProps) => {
  const { t } = useTranslation("auth");
  const { currentRestaurant } = useAuthStore();
  const { roles } = useRoles();
  const { updateRole } = useUpdateUserRole();

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
    onRequestRemove?.(user);
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
      />
    </BottomSheetView>
  );
};

export default ChangeUserRoleBottomSheet;
