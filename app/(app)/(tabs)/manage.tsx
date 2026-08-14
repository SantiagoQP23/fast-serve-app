import { ScrollView, Pressable, PressableProps, Linking } from "react-native";

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

interface CardButtonProps extends PressableProps {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
}

export const CardButton = ({ icon, label, onPress }: CardButtonProps) => {
  return (
    <Pressable onPress={onPress}>
      <ThemedView style={tw`flex-row gap-4`}>
        <ThemedView>
          <Ionicons name={icon} size={22} />
        </ThemedView>
        <ThemedText style={[{ fontFamily: typography.medium }]}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
};

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

  return (
    <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedView style={tw`items-center gap-2 flex-row justify-between`}>
          <ThemedText type="h2">{t("manage.title")}</ThemedText>
          <Pressable
            onPress={() => router.push("/(profile)/settings")}
            style={({ pressed }) => tw.style(pressed && "opacity-70")}
          >
            <Ionicons name="settings-outline" size={22} />
          </Pressable>
        </ThemedView>

        <ThemedView style={tw`my-4`} />

        {/* Subscription Banner */}
        {subscription && (
          <Card style={tw`gap-4 `}>
            <ThemedView style={tw`flex  gap-4`}>
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
              <ThemedText type="h3">{currentRestaurant?.name}</ThemedText>
              <ThemedView style={tw`flex-row items-center gap-2`}>
                <ThemedText style={[{ fontFamily: typography.medium }]}>
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
          </Card>
        )}
        <ThemedView style={tw`h-4`} />

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
            <ThemedView style={tw`flex-1`}>
              <ThemedText type="h3">
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
              color="default"
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

        <ThemedView style={tw`my-6`}>
          <ThemedView style={tw`rounded-lg p-4 gap-8`}>
            {/* Orders */}
            <ThemedView style={tw`gap-4`}>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("manage.orders")}
              </ThemedText>
              <ThemedView style={tw`gap-6`}>
                {isAdmin && (
                  <CardButton
                    icon="time-outline"
                    label={t("manage.history")}
                    onPress={() => {
                      router.push("/(profile)/history");
                    }}
                  />
                )}
              </ThemedView>
            </ThemedView>

            {/* Menu */}
            <ThemedView style={tw`gap-4`}>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("manage.menu.title")}
              </ThemedText>
              <ThemedView style={tw`gap-6`}>
                <CardButton
                  icon="list-outline"
                  label={t("manage.menu.sections")}
                />
                <CardButton
                  icon="pricetag-outline"
                  label={t("manage.menu.categories")}
                />
                <CardButton
                  icon="fast-food-outline"
                  label={t("manage.menu.products")}
                />
              </ThemedView>
            </ThemedView>

            {/* Restaurant */}
            <ThemedView style={tw`gap-6`}>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("manage.restaurant")}
              </ThemedText>
              <CardButton icon="grid-outline" label={t("manage.tables")} />
              <CardButton
                icon="card-outline"
                label={t("manage.paymentMethods")}
              />
              <CardButton
                icon="print-outline"
                label={t("manage.printers")}
                onPress={() => {
                  router.push("/(profile)/printers");
                }}
              />
              <CardButton
                icon="cube-outline"
                label={t("manage.productionAreas")}
                onPress={() => {
                  router.push("/(profile)/production-areas");
                }}
              />
              {isAdmin && (
                <CardButton
                  icon="people-outline"
                  label={t("manage.staff")}
                  onPress={() => {
                    router.push("/staff");
                  }}
                />
              )}
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Web management button (admin only) */}
        {isAdmin && (
          <ThemedView style={tw`mb-8 gap-2`}>
            <Button
              label={t("manage.userInfo.manageOnWeb")}
              onPress={handleOpenWeb}
              variant="outline"
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
