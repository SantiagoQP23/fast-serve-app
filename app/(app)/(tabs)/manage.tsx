import { ScrollView, Linking } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { router } from "expo-router";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import { typography } from "@/constants/theme";
import Label from "@/presentation/theme/components/label";
import { Roles } from "@/core/auth/models/user.model";
import { toast } from "sonner-native";
import Card from "@/presentation/theme/components/card";
import IconButton from "@/presentation/theme/components/icon-button";
import { GroupedList } from "@/presentation/theme/components/grouped-list";

interface ManageOption {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

export default function ManageScreen() {
  const { t } = useTranslation("auth");
  const { user, currentRestaurant } = useAuthStore();

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

  const isAdmin = user?.role?.name === Roles.ADMIN;
  const subscription = currentRestaurant?.subscription;

  const orderOptions: ManageOption[] = [
    ...(isAdmin
      ? [
          {
            key: "history",
            icon: "time-outline" as const,
            label: t("manage.history"),
            onPress: () => router.push("/(profile)/history"),
          },
        ]
      : []),
  ];

  const menuOptions: ManageOption[] = [
    {
      key: "sections",
      icon: "list-outline",
      label: t("manage.menu.sections"),
      onPress: () => router.push("/(profile)/menu-sections"),
    },
    {
      key: "categories",
      icon: "pricetag-outline",
      label: t("manage.menu.categories"),
      onPress: () => router.push("/(profile)/menu-categories"),
    },
    {
      key: "products",
      icon: "fast-food-outline",
      label: t("manage.menu.products"),
      onPress: () => router.push("/(profile)/menu-products"),
    },
  ];

  const restaurantOptions: ManageOption[] = [
    {
      key: "tables",
      icon: "grid-outline",
      label: t("manage.tables"),
      onPress: () => router.push("/(profile)/tables-settings"),
    },
    {
      key: "paymentMethods",
      icon: "card-outline",
      label: t("manage.paymentMethods"),
      onPress: () => router.push("/(profile)/payment-methods-settings"),
    },
    {
      key: "printers",
      icon: "print-outline",
      label: t("manage.printers"),
      onPress: () => router.push("/(profile)/printers"),
    },
    {
      key: "productionAreas",
      icon: "cube-outline",
      label: t("manage.productionAreas"),
      onPress: () => router.push("/(profile)/production-areas"),
    },
    ...(isAdmin
      ? [
          {
            key: "staff",
            icon: "people-outline" as const,
            label: t("manage.staff"),
            onPress: () => router.push("/staff"),
          },
        ]
      : []),
  ];

  const renderManageOption = (option: ManageOption) => (
    <ThemedView style={tw`flex-row items-center gap-4`}>
      <Ionicons name={option.icon} size={22} />
      <ThemedText style={[{ fontFamily: typography.medium }]}>
        {option.label}
      </ThemedText>
    </ThemedView>
  );

  return (
    <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedView style={tw`items-center gap-2 flex-row justify-between`}>
          <ThemedText type="h2">{t("manage.title")}</ThemedText>
          <IconButton
            onPress={() => router.push("/(profile)/settings")}
            icon="settings-outline"
            variant="secondary"
          ></IconButton>
        </ThemedView>

        <ThemedView style={tw`my-4`} />

        {/* Subscription Banner */}
        {subscription && (
          <ThemedView>
            <ThemedView style={tw`flex  items-center gap-2`}>
              {/* <Ionicons */}
              {/*   name={ */}
              {/*     subscription.status === "ACTIVE" */}
              {/*       ? "shield-checkmark-outline" */}
              {/*       : subscription.status === "TRIAL" */}
              {/*         ? "time-outline" */}
              {/*         : "alert-circle-outline" */}
              {/*   } */}
              {/*   size={20} */}
              {/*   color={ */}
              {/*     subscription.status === "ACTIVE" */}
              {/*       ? tw.color("green-500") */}
              {/*       : subscription.status === "TRIAL" */}
              {/*         ? tw.color("orange-500") */}
              {/*         : tw.color("red-500") */}
              {/*   } */}
              {/* /> */}
              <ThemedText type="h1">{currentRestaurant?.name}</ThemedText>
              <ThemedView style={tw`flex-row items-center gap-2`}>
                <ThemedText
                  type="body2"
                  style={[{ fontFamily: typography.medium }]}
                >
                  Plan: {subscription.plan?.name}
                </ThemedText>
                {subscription.plan && (
                  <Label
                    text={t(
                      `manage.subscription.${subscription.status.toLowerCase()}`,
                    )}
                    color="default"
                    size="small"
                  />
                )}
              </ThemedView>
            </ThemedView>
            {subscription.status === "TRIAL" && subscription.trialEndsAt && (
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("manage.subscription.trialEnds", {
                  date: new Date(subscription.trialEndsAt).toLocaleDateString(),
                })}
              </ThemedText>
            )}
          </ThemedView>
        )}
        <ThemedView style={tw`h-8`} />

        {/* User Info Card */}
        <Card
          onPress={() => router.push("/(profile)/edit-profile")}
          style={({ pressed }) => tw.style("  gap-4 ")}
        >
          <ThemedView style={tw`flex-row items-center gap-3`}>
            <Ionicons
              name="person-circle-outline"
              size={40}
              color={tw.color("gray-400")}
            />
            <ThemedView style={tw`flex-1 gap-1`}>
              <ThemedText type="body1">
                {user?.person?.firstName} {user?.person?.lastName}
              </ThemedText>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {user?.person?.email}
              </ThemedText>
            </ThemedView>
            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color={tw.color("gray-400")}
            />
          </ThemedView>
          <ThemedView style={tw`flex-row items-center gap-2`}>
            <Label
              text={user?.role?.description || ""}
              color="info"
              size="small"
            />
          </ThemedView>
        </Card>

        <ThemedView style={tw`h-4`} />
        <Button
          label={t("manage.manageOtherRestaurant")}
          onPress={() => router.push("/(profile)/restaurants")}
          variant="text"
          leftIcon="storefront-outline"
          style={tw`mt-4`}
          size="small"
        />

        <ThemedView style={tw`my-6 gap-6`}>
          {/* Orders */}
          {orderOptions.length > 0 && (
            <ThemedView style={tw`gap-2`}>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("manage.orders")}
              </ThemedText>
              <GroupedList
                data={orderOptions}
                keyExtractor={(option) => option.key}
                onItemPress={(option) => option.onPress()}
                renderItem={renderManageOption}
              />
            </ThemedView>
          )}

          {/* Menu */}
          <ThemedView style={tw`gap-2`}>
            <ThemedText type="small" style={tw`text-gray-500`}>
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
            <ThemedText type="small" style={tw`text-gray-500`}>
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
          <ThemedView style={tw`mb-8 gap-2`}>
            <Button
              label={t("manage.userInfo.manageOnWeb")}
              onPress={handleOpenWeb}
              variant="secondary"
              leftIcon="globe-outline"
            />
            <ThemedText type="small" style={tw`text-center text-gray-500`}>
              {t("manage.userInfo.webHint")}
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}
