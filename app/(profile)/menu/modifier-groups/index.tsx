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
import Card from "@/presentation/theme/components/card";
import DetailHeader from "@/presentation/theme/components/detail-header";
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
  const hasSearch = !!search.trim();

  const openGroup = (groupId?: string) =>
    router.push({
      pathname: "/(profile)/menu/modifier-groups/form",
      params: groupId ? { groupId } : {},
    });

  // What the waiter is asked, then how far a change reaches.
  const describe = (group: ModifierGroup) =>
    [
      group.maxSelect === 1
        ? t("modifierGroups.pickOne")
        : t("modifierGroups.pickMany"),
      group.minSelect > 0
        ? t("modifierGroups.required")
        : t("modifierGroups.optional"),
      t("modifierGroups.productsCount", {
        count: group.productIds?.length ?? 0,
      }),
    ].join(" · ");

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
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={tw`gap-4 pb-8`}
        refreshControl={
          <RefreshControl
            refreshing={groupsQuery.isFetching && !groupsQuery.isLoading}
            onRefresh={groupsQuery.refetch}
            tintColor={tw.color("primary")}
            colors={[tw.color("primary") as string]}
          />
        }
      >
        <DetailHeader
          title={t("modifierGroups.title")}
          subtitle={t("modifierGroups.subtitle")}
        >
          {canManage && (
            <ThemedView style={tw`flex-row flex-wrap gap-3`}>
              <Button
                label={t("modifierGroups.newGroup")}
                leftIcon="plus"
                shape="rounded"
                size="small"
                onPress={() => openGroup()}
              />
            </ThemedView>
          )}
        </DetailHeader>

        {groups.length > 0 && (
          <TextInput
            placeholder={t("modifierGroups.searchPlaceholder")}
            icon="search"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        )}

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
            <ThemedText type="body1" style={{ fontFamily: typography.bold }}>
              {t("modifierGroups.empty")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {t("modifierGroups.emptyDescription")}
            </ThemedText>
          </ThemedView>
        )}

        {hasSearch && groups.length > 0 && filtered.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="search" size={40} color={tw.color("gray-400")} />
            <ThemedText type="body1" style={{ fontFamily: typography.bold }}>
              {t("modifierGroups.noResults")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {t("modifierGroups.noResultsDescription")}
            </ThemedText>
          </ThemedView>
        )}

        {filtered.map((group) => (
          <Card
            key={group.id}
            onPress={() => openGroup(group.id)}
            variant="outline"
            style={!group.isActive && tw`opacity-50`}
          >
            <ThemedView style={tw`flex-row items-start gap-4`}>
              <Icon
                name="list-checks"
                size={28}
                color={tw.color("text-on-surface-variant")}
              />
              <ThemedView style={tw`flex-1 gap-1`}>
                <ThemedText type="h4">{group.name}</ThemedText>
                {group.modifiers.length > 0 && (
                  <ThemedText
                    type="body2"
                    style={tw`text-gray-600`}
                    numberOfLines={2}
                  >
                    {group.modifiers.map((option) => option.name).join(", ")}
                  </ThemedText>
                )}
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {describe(group)}
                </ThemedText>
                {!group.isActive && (
                  // A row, so the Label keeps its own width
                  <ThemedView style={tw`flex-row mt-1`}>
                    <Label text={t("modifierGroups.inactive")} />
                  </ThemedView>
                )}
              </ThemedView>
            </ThemedView>
          </Card>
        ))}
      </ScrollView>
    </ScreenLayout>
  );
}
