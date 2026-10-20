import { useContext, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";

import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { getErrorMessage } from "@/core/api/get-error-message";
import { getApiError } from "@/core/api/api-response";
import { Roles, User } from "@/core/auth/models/user.model";
import { getUsers } from "@/core/users/actions/user-actions";
import { RestaurantService } from "@/core/restaurant/services/restaurant.service";
import type { BranchRole } from "@/core/restaurant/dto/create-branch.dto";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import {
  NO_AREA_KEY,
  useCreateBranchStore,
} from "@/presentation/restaurant/store/useCreateBranchStore";
import { SocketContext } from "@/presentation/shared/context/SocketContext";

import Avatar from "@/presentation/theme/components/avatar";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";
import Button from "@/presentation/theme/components/button";
import Checkbox from "@/presentation/theme/components/checkbox";
import Chip from "@/presentation/theme/components/chip";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";

const BRANCH_ROLES: BranchRole[] = [
  Roles.ADMIN,
  Roles.CASHIER,
  Roles.WAITER,
  Roles.COOK,
];

/**
 * Paso 3 de "Crear sucursal": quién tendrá acceso y con qué rol (empieza con
 * su rol de aquí). Al crear, la app entra a la sucursal como al crear un
 * restaurante; sin toast de éxito, entrar a la sucursal lo confirma.
 */
export default function CreateBranchUsersScreen() {
  const { t } = useTranslation("auth");
  const { user: currentUser, currentRestaurant, changeStatus } = useAuthStore();
  const { online } = useContext(SocketContext);
  const {
    details,
    tables,
    users: selected,
    setUsers,
    reset,
  } = useCreateBranchStore();

  const roleSheetRef = useRef<BottomSheetPickerRef>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["users", "all", currentRestaurant?.id],
    queryFn: () => getUsers({ limit: 500 }),
    enabled: !!currentRestaurant,
  });

  const staff = useMemo(
    () => (usersQuery.data ?? []).filter((u) => u.id !== currentUser?.id),
    [usersQuery.data, currentUser?.id],
  );

  /** Rol que la persona tiene hoy aquí; un dueño pasa a administrador. */
  const currentRoleOf = (member: User): BranchRole => {
    const role = member.restaurantRoles.find(
      (rr) => rr.restaurant.id === currentRestaurant?.id,
    )?.role.name;
    return role && role !== Roles.OWNER ? role : Roles.ADMIN;
  };

  const toggle = (member: User) => {
    const next = { ...useCreateBranchStore.getState().users };
    if (next[member.id]) delete next[member.id];
    else next[member.id] = currentRoleOf(member);
    setUsers(next);
  };

  const allSelected =
    staff.length > 0 && staff.every((member) => !!selected[member.id]);

  const toggleAll = () => {
    if (allSelected) {
      setUsers({});
      return;
    }
    const next = { ...useCreateBranchStore.getState().users };
    staff.forEach((member) => {
      if (!next[member.id]) next[member.id] = currentRoleOf(member);
    });
    setUsers(next);
  };

  const openRolePicker = (memberId: string) => {
    setEditingUserId(memberId);
    roleSheetRef.current?.present();
  };

  const createBranch = useMutation({
    mutationFn: () =>
      RestaurantService.createBranch(currentRestaurant!.id, {
        name: details.name.trim(),
        address: details.address.trim(),
        phone: details.phone.trim(),
        email: details.email.trim(),
        tables: Object.entries(tables)
          .filter(([, quantity]) => quantity > 0)
          .map(([key, quantity]) => ({
            areaId: key === NO_AREA_KEY ? null : key,
            quantity,
          })),
        users: Object.entries(selected)
          // Solo personas que siguen en el restaurante.
          .filter(([userId]) => staff.some((member) => member.id === userId))
          .map(([userId, role]) => ({ userId, role })),
      }),
  });

  const handleCreate = async () => {
    try {
      const response = await createBranch.mutateAsync();
      await changeStatus(
        response.token,
        response.user,
        response.currentRestaurant ?? undefined,
      );
      if (useAuthStore.getState().bootstrapStatus === "error") {
        toast.error(t("validations.bootstrapError"));
      }
      reset();
      if (router.canDismiss()) router.dismissAll();
      router.replace("/(app)/(tabs)/(orders-module)/my-orders");
    } catch (error) {
      toast.error(
        getErrorMessage(error, { fallback: t("createBranch.errorMessage") }),
      );
      // Nombre repetido: vuelve al paso de los datos.
      if (getApiError(error).code === "RESTAURANT_DUPLICATE_NAME") {
        router.dismissTo("/(profile)/restaurant/create-branch");
      }
    }
  };

  const selectedCount = Object.keys(selected).filter((id) =>
    staff.some((member) => member.id === id),
  ).length;

  return (
    <ScreenLayout style={tw`flex-1 px-4`}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`gap-4 pt-2 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={tw`gap-2`}>
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("createBranch.steps", { step: 3 })}
          </ThemedText>
          <ThemedText type="body2" style={tw`text-gray-600`}>
            {t("createBranch.users.subtitle")}
          </ThemedText>
        </ThemedView>

        {usersQuery.isLoading ? (
          <ActivityIndicator style={tw`py-8`} />
        ) : usersQuery.isError ? (
          <ThemedView style={tw`items-center gap-3 py-8`}>
            <ThemedText type="body2" style={tw`text-red-500`}>
              {t("createBranch.users.loadError")}
            </ThemedText>
            <Button
              label={t("createBranch.users.retry")}
              variant="surface"
              size="small"
              onPress={() => usersQuery.refetch()}
            />
          </ThemedView>
        ) : staff.length === 0 ? (
          <ThemedText type="body2" style={tw`text-gray-500 text-center py-8`}>
            {t("createBranch.users.empty")}
          </ThemedText>
        ) : (
          <>
            <ThemedView style={tw`flex-row items-center justify-between`}>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("createBranch.users.selected", { count: selectedCount })}
              </ThemedText>
              <Button
                label={
                  allSelected
                    ? t("createBranch.users.deselectAll")
                    : t("createBranch.users.selectAll")
                }
                variant="text"
                size="small"
                onPress={toggleAll}
              />
            </ThemedView>

            <ThemedView style={tw`gap-2`}>
              {staff.map((member) => {
                const role = selected[member.id];
                const fullName =
                  `${member.person?.firstName ?? ""} ${member.person?.lastName ?? ""}`.trim() ||
                  member.username;
                return (
                  <Pressable
                    key={member.id}
                    onPress={() => toggle(member)}
                    style={({ pressed }) =>
                      tw.style(
                        "flex-row items-center gap-3 px-4 py-3 rounded-2xl bg-surface",
                        pressed && "opacity-80",
                      )
                    }
                  >
                    <Checkbox
                      value={!!role}
                      onValueChange={() => toggle(member)}
                    />
                    <Avatar name={member.person?.firstName} size={36} />
                    <ThemedView style={tw`flex-1 bg-transparent`}>
                      <ThemedText
                        type="body1"
                        style={{ fontFamily: typography.medium }}
                      >
                        {fullName}
                      </ThemedText>
                      <ThemedText type="small" style={tw`text-gray-500`}>
                        @{member.username}
                      </ThemedText>
                    </ThemedView>
                    {role && (
                      <Chip
                        label={t(`roles.${role}`)}
                        selected
                        icon="chevron-down"
                        onPress={() => openRolePicker(member.id)}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ThemedView>
          </>
        )}
      </ScrollView>

      <ThemedView style={tw`gap-2 mb-8`}>
        {!online && (
          <ThemedText type="small" style={tw`text-gray-500 text-center`}>
            {t("createBranch.offline")}
          </ThemedText>
        )}
        <Button
          label={
            createBranch.isPending
              ? t("createBranch.users.creating")
              : t("createBranch.users.submit")
          }
          onPress={handleCreate}
          loading={createBranch.isPending}
          disabled={!online || createBranch.isPending || usersQuery.isLoading}
        />
      </ThemedView>

      <BottomSheetPicker
        ref={roleSheetRef}
        title={t("createBranch.users.roleTitle")}
        options={BRANCH_ROLES.map((role) => ({
          value: role,
          label: t(`roles.${role}`),
        }))}
        value={editingUserId ? selected[editingUserId] : undefined}
        onChange={(value) => {
          if (!editingUserId) return;
          setUsers({
            ...useCreateBranchStore.getState().users,
            [editingUserId]: value as BranchRole,
          });
        }}
        onDismiss={() => setEditingUserId(null)}
      />

      {createBranch.isPending && (
        <ThemedView
          style={tw`absolute inset-0 bg-black/20 justify-center items-center`}
        >
          <ActivityIndicator />
        </ThemedView>
      )}
    </ScreenLayout>
  );
}
