import { useMemo, useState } from "react";
import type { IFuseOptions } from "fuse.js";
import { ScrollView, RefreshControl, Pressable } from "react-native";
import { router } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Fab from "@/presentation/theme/components/fab";
import Label from "@/presentation/theme/components/label";
import TextInput from "@/presentation/theme/components/text-input";
import { useModifierGroups } from "@/presentation/menu-management/hooks/useModifierGroups";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import { useFuzzySearch } from "@/presentation/shared/hooks/useFuzzySearch";
import type { ModifierGroup } from "@/core/menu/models/customization.model";

const GROUP_SEARCH_OPTIONS: IFuseOptions<ModifierGroup> = {
  keys: ["name", "modifiers.name"],
};

/**
 * "Grupos de opciones": shared lists such as "Sabor" or "Extras de mariscos"
 * that products link to, so one change reaches every product using it.
 */
export default function ModifierGroupsScreen() {
  const { t } = useTranslation("menuManagement");
  const { user } = useAuthStore();
  const canManage = isAdminLevelRole(user?.role?.name);
  const { groups, groupsQuery } = useModifierGroups();
  const [search, setSearch] = useState("");

  const sorted = useMemo(
    () => [...groups].sort((a, b) => a.name.localeCompare(b.name)),
    [groups],
  );
  const filtered = useFuzzySearch(sorted, search, GROUP_SEARCH_OPTIONS);

  const openGroup = (groupId?: string) =>
    router.push({
      pathname: "/(profile)/menu/modifier-groups/form",
      params: groupId ? { groupId } : {},
    });

  const describe = (group: ModifierGroup) =>
    [
      group.maxSelect === 1
        ? t("modifierGroups.pickOne")
        : t("modifierGroups.pickMany"),
      group.minSelect > 0
        ? t("modifierGroups.required")
        : t("modifierGroups.optional"),
      t("modifierGroups.optionsCount", { count: group.modifiers.length }),
      t("modifierGroups.productsCount", {
        count: group.productIds?.length ?? 0,
      }),
    ].join(" · ");

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ThemedView style={tw`px-4 pt-8 gap-4 bg-transparent`}>
        <ThemedView style={tw`items-center gap-3 flex-row bg-transparent`}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t("common:actions.goBack")}
            style={({ pressed }) => tw.style(pressed && "opacity-70")}
          >
            <Icon name="arrow-left" color={tw.color("on-surface")} size={24} />
          </Pressable>
          <ThemedText
            type="h3"
            style={{ fontFamily: typography.medium, flex: 1 }}
            numberOfLines={1}
          >
            {t("modifierGroups.title")}
          </ThemedText>
        </ThemedView>
        {groups.length > 0 && (
          <TextInput
            placeholder={t("modifierGroups.searchPlaceholder")}
            icon="search"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        )}
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 pb-28 pt-4`}
        refreshControl={
          <RefreshControl
            refreshing={groupsQuery.isFetching && !groupsQuery.isLoading}
            onRefresh={groupsQuery.refetch}
            tintColor={tw.color("primary")}
            colors={[tw.color("primary") as string]}
          />
        }
      >
        {groupsQuery.isLoading && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {t("loading")}
            </ThemedText>
          </ThemedView>
        )}

        {groupsQuery.isError && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="circle-alert" size={48} color={tw.color("red-500")} />
            <ThemedText type="body1" style={tw`text-red-500`}>
              {t("modifierGroups.loadError")}
            </ThemedText>
            <Button
              label={t("retry")}
              onPress={() => groupsQuery.refetch()}
              variant="outline"
            />
          </ThemedView>
        )}

        {!groupsQuery.isLoading && !groupsQuery.isError && groups.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="list-checks" size={48} color={tw.color("gray-400")} />
            <ThemedText type="body1" style={tw`font-semibold`}>
              {t("modifierGroups.empty")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {t("modifierGroups.emptyDescription")}
            </ThemedText>
          </ThemedView>
        )}

        {filtered.map((group) => (
          <Pressable
            key={group.id}
            onPress={() => openGroup(group.id)}
            accessibilityRole="button"
            style={({ pressed }) =>
              tw.style("flex-row items-center gap-4 py-3", pressed && "opacity-70")
            }
          >
            <ThemedView style={tw`flex-1 gap-0.5 bg-transparent`}>
              <ThemedView style={tw`flex-row items-center gap-2 bg-transparent`}>
                <ThemedText
                  style={[tw`shrink`, { fontFamily: typography.medium }]}
                  numberOfLines={1}
                >
                  {group.name}
                </ThemedText>
                {!group.isActive && (
                  <Label
                    size="small"
                    color="default"
                    text={t("modifierGroups.inactive")}
                  />
                )}
              </ThemedView>
              <ThemedText type="small" style={tw`text-gray-500`} numberOfLines={1}>
                {describe(group)}
              </ThemedText>
            </ThemedView>
            <Icon name="chevron-right" size={20} color={tw.color("gray-400")} />
          </Pressable>
        ))}
      </ScrollView>

      {canManage && (
        <Fab
          icon="plus"
          label={t("modifierGroups.newGroup")}
          onPress={() => openGroup()}
        />
      )}
    </ScreenLayout>
  );
}
