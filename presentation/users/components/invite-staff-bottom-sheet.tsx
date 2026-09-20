import { useState } from "react";
import { router } from "expo-router";
import { Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetFlatList,
  BottomSheetView,
} from "@expo/ui/community/bottom-sheet";

import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { Roles, User } from "@/core/auth/models/user.model";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import TextInput from "@/presentation/theme/components/text-input";
import Select from "@/presentation/theme/components/select";
import Button from "@/presentation/theme/components/button";

import { useRoles } from "@/presentation/auth/hooks/useRoles";
import { useUsersSuggestions } from "@/presentation/users/hooks/useUsersSuggestions";
import { useInvitation } from "@/presentation/users/hooks/useInvitation";

interface InviteStaffBottomSheetProps {
  existingUserIds: string[];
  onClose?: () => void;
  onInvited?: () => void;
}

const InviteStaffBottomSheet = ({
  existingUserIds,
  onClose,
  onInvited,
}: InviteStaffBottomSheetProps) => {
  const { t } = useTranslation("auth");
  const { roles } = useRoles();
  const { search, handleChangeSearch, users, isLoading } =
    useUsersSuggestions();
  const { sendInvitation } = useInvitation();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  const availableUsers = users.filter(
    (user) => !existingUserIds.includes(user.id),
  );

  const handleInvite = () => {
    if (!selectedUserId || !selectedRoleId) return;

    sendInvitation.mutate(
      { userId: selectedUserId, roleId: selectedRoleId },
      {
        onSuccess: () => {
          setSelectedUserId(null);
          handleChangeSearch("");
          onInvited?.();
          onClose?.();
        },
      },
    );
  };

  const handleScanQr = () => {
    onClose?.();
    router.push("/scan-qr-invite");
  };

  return (
    <BottomSheetView style={tw`px-4 pb-6 gap-4`}>
      <ThemedView style={tw`mb-1`}>
        <ThemedText type="h3">{t("staff.invite.title")}</ThemedText>
        <ThemedText type="body2" style={tw`text-gray-500 mt-1`}>
          {t("staff.invite.description")}
        </ThemedText>
      </ThemedView>

      <TextInput
        bottomSheet
        icon="search-outline"
        placeholder={t("staff.invite.searchPlaceholder")}
        value={search}
        onChangeText={handleChangeSearch}
        autoCapitalize="none"
      />

      <Select
        label={t("staff.invite.roleLabel")}
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

      {isLoading ? (
        <ThemedView style={tw`py-6 items-center`}>
          <ActivityIndicator />
        </ThemedView>
      ) : search && availableUsers.length === 0 ? (
        <ThemedView style={tw`py-6 items-center`}>
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {t("staff.invite.noResults")}
          </ThemedText>
        </ThemedView>
      ) : (
        <BottomSheetFlatList
          data={availableUsers}
          keyExtractor={(item: User) => item.id}
          contentContainerStyle={tw`gap-2`}
          renderItem={({ item: user }: { item: User }) => {
            const isSelected = selectedUserId === user.id;
            return (
              <Pressable
                onPress={() => setSelectedUserId(user.id)}
                style={({ pressed }) => [
                  tw.style(
                    "flex-row items-center justify-between gap-2 p-3 rounded-xl border",
                    isSelected
                      ? "border-light-primary bg-light-primary/5"
                      : "border-gray-200",
                    pressed && "opacity-70",
                  ),
                ]}
              >
                <ThemedView style={tw`flex-1`}>
                  <ThemedText type="body1">
                    {user.person.firstName} {user.person.lastName}
                  </ThemedText>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {user.email}
                  </ThemedText>
                </ThemedView>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={tw.color("light-primary")}
                  />
                )}
              </Pressable>
            );
          }}
        />
      )}

      <Button
        label={t("staff.invite.submit")}
        onPress={handleInvite}
        disabled={!selectedUserId || !selectedRoleId || sendInvitation.isPending}
        loading={sendInvitation.isPending}
      />

      <ThemedView style={tw`flex-row items-center gap-3 my-1`}>
        <ThemedView style={tw`flex-1 h-px bg-gray-200`} />
        <ThemedText type="small" style={tw`text-gray-400`}>
          {t("staff.invite.or")}
        </ThemedText>
        <ThemedView style={tw`flex-1 h-px bg-gray-200`} />
      </ThemedView>

      <Button
        label={t("staff.invite.scanQr")}
        onPress={handleScanQr}
        variant="outline"
        leftIcon="qr-code-outline"
      />
    </BottomSheetView>
  );
};

export default InviteStaffBottomSheet;
