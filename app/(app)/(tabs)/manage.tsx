import { useRef } from "react";
import { ScrollView, Linking } from "react-native";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { router } from "expo-router";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import { typography } from "@/constants/theme";
import Label from "@/presentation/theme/components/label";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import { toast } from "sonner-native";
import IconButton from "@/presentation/theme/components/icon-button";
import { GroupedList } from "@/presentation/theme/components/grouped-list";
import Avatar from "@/presentation/theme/components/avatar";
import UserInfoBottomSheet from "@/presentation/auth/components/user-info-bottom-sheet";

interface ManageOption {
  key: string;
  icon: IconName;
  label: string;
  onPress: () => void;
}

export default function ManageScreen() {
  const { t } = useTranslation("auth");
  const { user, currentRestaurant } = useAuthStore();
  const userInfoSheetRef = useRef<BottomSheetMethods>(null);

  const handleOpenWeb = async () => {
    const appUrl = process.env.EXPO_PUBLIC_APP_URL;

    if (!appUrl) {
      toast.error("Web URL is not configured");
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(appUrl);
      if (canOpen) {
        await Linking.openURL(appUrl);
      } else {
        toast.error("Cannot open web version");
      }
    } catch (error) {
      toast.error("Failed to open web version");
    }
  };

  const isAdmin = isAdminLevelRole(user?.role?.name);
  const subscription = currentRestaurant?.subscription;

  const menuOptions: ManageOption[] = [
    {
      key: "overview",
      icon: "utensils",
      label: t("manage.menu.overview"),
      onPress: () => router.push("/(profile)/menu/overview"),
    },
    // ...(isAdmin
    //   ? [
    //       {
    //         key: "tags",
    //         icon: "tag" as IconName,
    //         label: t("manage.menu.tags"),
    //         onPress: () => router.push("/(profile)/menu/tags"),
    //       },
    //     ]
    //   : []),
    {
      key: "productionAreas",
      icon: "package",
      label: t("manage.productionAreas"),
      onPress: () => router.push("/(profile)/production/areas"),
    },
    // Hidden in favor of the consolidated menu-overview screen — routes are
    // still registered and reachable, just not linked from here.
    // {
    //   key: "sections",
    //   icon: "list",
    //   label: t("manage.menu.sections"),
    //   onPress: () => router.push("/(profile)/menu/sections"),
    // },
    // {
    //   key: "categories",
    //   icon: "tag",
    //   label: t("manage.menu.categories"),
    //   onPress: () => router.push("/(profile)/menu/categories"),
    // },
    // {
    //   key: "products",
    //   icon: "hamburger",
    //   label: t("manage.menu.products"),
    //   onPress: () => router.push("/(profile)/menu/products"),
    // },
    // Hidden for now — route is still registered and reachable, just not
    // linked from here.
    // {
    //   key: "inventory",
    //   icon: "package",
    //   label: t("manage.menu.inventory"),
    //   onPress: () => router.push("/(profile)/inventory/items"),
    // },
  ];

  const restaurantOptions: ManageOption[] = [
    {
      key: "tables",
      icon: "layout-grid",
      label: t("manage.tables"),
      onPress: () => router.push("/(profile)/tables"),
    },
    {
      key: "paymentMethods",
      icon: "credit-card",
      label: t("manage.paymentMethods"),
      onPress: () => router.push("/(profile)/payment-methods"),
    },
    {
      key: "restaurantSettings",
      icon: "sliders-horizontal",
      label: t("manage.restaurantSettings"),
      onPress: () => router.push("/(profile)/restaurant/settings"),
    },
    ...(isAdmin
      ? [
          {
            key: "staff",
            icon: "users" as const,
            label: t("manage.staff"),
            onPress: () => router.push("/staff"),
          },
        ]
      : []),
  ];

  const renderManageOption = (option: ManageOption) => (
    <ThemedView style={tw`flex-row items-center gap-4`}>
      <Icon name={option.icon} color={tw.color("on-surface")} size={22} />
      <ThemedText style={[tw`flex-1`, { fontFamily: typography.medium }]}>
        {option.label}
      </ThemedText>
      <Icon name="chevron-right" size={20} color={tw.color("primary")} />
    </ThemedView>
  );

  return (
    <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
      <ThemedView style={tw`items-center gap-2 flex-row justify-between`}>
        <ThemedText type="h3">Teikio</ThemedText>
        <ThemedView style={tw`items-center gap-3 flex-row`}>
          <Avatar
            name={user?.person?.firstName}
            variant="surface"
            size={36}
            onPress={() => userInfoSheetRef.current?.present()}
          />
          <IconButton
            onPress={() => router.push("/(profile)/account/settings")}
            icon="settings"
            size={22}
          ></IconButton>
        </ThemedView>
      </ThemedView>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedView style={tw`my-4`} />

        {/* Restaurant summary */}
        <ThemedView style={tw` gap-2`}>
          <ThemedText type="h1">{currentRestaurant?.name}</ThemedText>
          {currentRestaurant?.parentRestaurant && (
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("createBranch.branchOf", {
                name: currentRestaurant.parentRestaurant.name,
              })}
            </ThemedText>
          )}
          {subscription?.plan && (
            <ThemedView style={tw`flex-row items-center gap-2`}>
              <ThemedText
                type="body2"
                style={[{ fontFamily: typography.medium }]}
              >
                {t("manage.subscription.plan")}: {subscription.plan.name}
              </ThemedText>
              <Label
                text={t(
                  `manage.subscription.${subscription.status.toLowerCase()}`,
                )}
                color="default"
                size="small"
              />
            </ThemedView>
          )}
        </ThemedView>
        <ThemedView style={tw`flex-row mb-8`}>
          <Button
            label={t("manage.restaurantInfo")}
            onPress={() => router.push("/(profile)/restaurant/info")}
            variant="outline"
            leftIcon="store"
            size="extra-small"
            style={tw`mt-4`}
          />
        </ThemedView>

        <ThemedView style={tw`my-6 gap-6`}>
          {/* Menu */}
          <ThemedView style={tw`gap-2`}>
            <ThemedText type="body2" style={tw`text-primary`}>
              {t("manage.menu.title")}
            </ThemedText>
            <GroupedList
              data={menuOptions}
              keyExtractor={(option) => option.key}
              onItemPress={(option) => option.onPress()}
              renderItem={renderManageOption}
            />
          </ThemedView>

          {/* Restaurant */}
          <ThemedView style={tw`gap-2`}>
            <ThemedText type="body2" style={tw`text-primary`}>
              {t("manage.restaurant")}
            </ThemedText>
            <GroupedList
              data={restaurantOptions}
              keyExtractor={(option) => option.key}
              onItemPress={(option) => option.onPress()}
              renderItem={renderManageOption}
            />
          </ThemedView>
        </ThemedView>

        {/* Web management button (admin only) */}
        {isAdmin && (
          <Button
            label={t("manage.userInfo.openWebVersion")}
            onPress={handleOpenWeb}
            variant="text"
            leftIcon="globe"
            size="small"
            style={tw`mb-8`}
          />
        )}
      </ScrollView>

      <UserInfoBottomSheet ref={userInfoSheetRef} user={user} />
    </ScreenLayout>
  );
}
