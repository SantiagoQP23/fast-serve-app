import { useEffect } from "react";
import { Pressable, ScrollView } from "react-native";
import { router, useNavigation } from "expo-router";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import Icon from "@/presentation/theme/components/icon";
import Button from "@/presentation/theme/components/button";
import Label from "@/presentation/theme/components/label";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { isAdminLevelRole, Roles } from "@/core/auth/models/user.model";

interface InfoRowProps {
  label: string;
  value?: string | number | null;
  placeholder: string;
}

/** Read-only label/value row; muted placeholder when the value is empty. */
function InfoRow({ label, value, placeholder }: InfoRowProps) {
  const hasValue = value !== undefined && value !== null && value !== "";

  return (
    <ThemedView style={tw`flex-row items-center gap-3 min-h-12`}>
      <ThemedText>{label}</ThemedText>
      <ThemedText
        type="body2"
        style={[
          tw`flex-1 text-right`,
          { color: tw.color(hasValue ? "gray-600" : "gray-400") },
        ]}
      >
        {hasValue ? String(value) : placeholder}
      </ThemedText>
    </ThemedView>
  );
}

export default function RestaurantInfoScreen() {
  const { t } = useTranslation("auth");
  const navigation = useNavigation();
  const { user, currentRestaurant } = useAuthStore();

  const canEdit = isAdminLevelRole(user?.role?.name);
  const isOwner = user?.role?.name === Roles.OWNER;
  const subscription = currentRestaurant?.subscription;
  const notSet = t("manage.notSet");

  useEffect(() => {
    navigation.setOptions({
      headerRight: canEdit
        ? () => (
            <Button
              label={t("manage.edit")}
              leftIcon="pencil"
              variant="surface"
              size="extra-small"
              onPress={() => router.push("/(profile)/restaurant/edit")}
            />
          )
        : undefined,
    });
  }, [navigation, canEdit, t]);

  const subscriptionContent = subscription && (
    <ThemedView style={tw`flex-row items-center gap-3 min-h-12`}>
      <ThemedView style={tw`flex-1 gap-1`}>
        <ThemedView style={tw`flex-row items-center gap-2`}>
          <ThemedText>
            {t("manage.subscription.plan")}: {subscription.plan?.name ?? notSet}
          </ThemedText>
          <Label
            text={t(`manage.subscription.${subscription.status.toLowerCase()}`)}
            color="default"
            size="small"
          />
        </ThemedView>
        {subscription.status === "TRIAL" && subscription.trialEndsAt ? (
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("manage.subscription.trialEnds", {
              date: new Date(subscription.trialEndsAt).toLocaleDateString(),
            })}
          </ThemedText>
        ) : (
          subscription.currentPeriodEnd && (
            <ThemedText type="small" style={tw`text-gray-500`}>
              {t("manage.subscription.periodEnds")}{" "}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </ThemedText>
          )
        )}
      </ThemedView>
      {isOwner && (
        <Icon name="chevron-right" size={18} color={tw.color("gray-400")} />
      )}
    </ThemedView>
  );

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-2`}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedView style={tw`gap-6 pb-8`}>
          {/* Title */}
          <ThemedView style={tw`gap-1`}>
            <ThemedText type="h1">{currentRestaurant?.name}</ThemedText>
            {currentRestaurant?.parentRestaurant && (
              <ThemedText type="body2" style={tw`text-gray-500`}>
                {t("createBranch.branchOf", {
                  name: currentRestaurant.parentRestaurant.name,
                })}
              </ThemedText>
            )}
          </ThemedView>

          {/* Details */}
          <ThemedView>
            <InfoRow
              label={t("createRestaurant.phone")}
              value={currentRestaurant?.phone}
              placeholder={notSet}
            />
            <InfoRow
              label={t("createRestaurant.email")}
              value={currentRestaurant?.email}
              placeholder={notSet}
            />
            <InfoRow
              label={t("createRestaurant.address")}
              value={currentRestaurant?.address}
              placeholder={notSet}
            />
            <InfoRow
              label={t("editRestaurant.identification")}
              value={currentRestaurant?.identification}
              placeholder={notSet}
            />
            <InfoRow
              label={t("editRestaurant.capacity")}
              value={currentRestaurant?.capacity}
              placeholder={notSet}
            />
          </ThemedView>

          {/* Subscription */}
          {subscription && (
            <ThemedView style={tw`gap-1`}>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("manage.subscription.title")}
              </ThemedText>
              {isOwner ? (
                <Pressable
                  onPress={() =>
                    router.push("/(profile)/restaurant/subscription")
                  }
                  accessibilityRole="button"
                  style={({ pressed }) => [pressed && tw`opacity-60`]}
                >
                  {subscriptionContent}
                </Pressable>
              ) : (
                subscriptionContent
              )}
            </ThemedView>
          )}

          <Button
            label={t("manage.manageOtherRestaurant")}
            onPress={() => router.push("/(profile)/restaurant/list")}
            variant="text"
            leftIcon="store"
            size="small"
          />
        </ThemedView>
      </ScrollView>
    </ScreenLayout>
  );
}
