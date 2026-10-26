import { useEffect, type ReactNode } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
} from "react-native";
import { router, useNavigation } from "expo-router";
import { toast } from "sonner-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import IconButton from "@/presentation/theme/components/icon-button";
import Button from "@/presentation/theme/components/button";
import { labelSolidStyles } from "@/presentation/theme/components/label";
import SubscriptionStatusLabel from "@/presentation/subscriptions/components/subscription-status-label";
import {
  SUBSCRIPTION_STATUS_COLOR,
  getSubscriptionDateLine,
  hasSubscriptionProblem,
} from "@/presentation/subscriptions/utils/subscription-status";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatDate } from "@/core/i18n/utils";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { isAdminLevelRole, Roles } from "@/core/auth/models/user.model";
import type { Subscription } from "@/core/common/models/restaurant.model";
import { typography } from "@/constants/theme";

type EditableField =
  | "phone"
  | "email"
  | "address"
  | "identification"
  | "capacity";

/** Opens the edit form with `field` focused, so filling a gap is one tap. */
const editField = (field: EditableField) =>
  router.push({
    pathname: "/(profile)/restaurant/edit",
    params: { focus: field },
  });

/** Titled group of rows. */
function InfoSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <ThemedView>
      <ThemedText
        type="body1"
        accessibilityRole="header"
        style={[tw`text-on-surface`, { fontFamily: typography.semibold }]}
      >
        {title}
      </ThemedText>
      {children}
    </ThemedView>
  );
}

interface InfoRowProps {
  label: string;
  value?: string | number | null;
  /** Shown when the value is empty and there's no `onAdd`. */
  placeholder: string;
  /** Turns an empty value into an "Add" link. */
  onAdd?: () => void;
  addLabel: string;
  /** Trailing shortcut for a filled value, e.g. call or email. */
  action?: { icon: IconName; label: string; onPress: () => void };
}

/** Label stacked over its value; values are selectable so they can be copied. */
function InfoRow({
  label,
  value,
  placeholder,
  onAdd,
  addLabel,
  action,
}: InfoRowProps) {
  const hasValue = value !== undefined && value !== null && value !== "";

  if (!hasValue && onAdd) {
    return (
      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${addLabel}`}
        style={({ pressed }) => [
          tw`min-h-16 justify-center gap-0.5`,
          pressed && tw`opacity-60`,
        ]}
      >
        <ThemedText type="small">{label}</ThemedText>
        <ThemedView style={tw`flex-row items-center gap-1.5`}>
          <Icon name="plus" size={16} color={tw.color("primary")} />
          <ThemedText
            style={[tw`text-primary`, { fontFamily: typography.semibold }]}
          >
            {addLabel}
          </ThemedText>
        </ThemedView>
      </Pressable>
    );
  }

  return (
    <ThemedView style={tw`flex-row items-center gap-3 min-h-16`}>
      <ThemedView
        accessible
        accessibilityLabel={`${label}, ${hasValue ? value : placeholder}`}
        style={tw`flex-1 gap-0.5`}
      >
        <ThemedText type="small">{label}</ThemedText>
        {hasValue ? (
          <ThemedText selectable>{String(value)}</ThemedText>
        ) : (
          <ThemedText style={tw`text-gray-500`}>{placeholder}</ThemedText>
        )}
      </ThemedView>
      {hasValue && action && (
        <IconButton
          icon={action.icon}
          variant="surface"
          accessibilityLabel={action.label}
          onPress={action.onPress}
        />
      )}
    </ThemedView>
  );
}

/** Plan and status, the date that matters for that status, and why it needs attention. */
function SubscriptionSummary({
  subscription,
  isOwner,
}: {
  subscription: Subscription;
  isOwner: boolean;
}) {
  const { t } = useTranslation("auth");
  const { status, plan } = subscription;

  const statusText = t(`manage.subscription.${status.toLowerCase()}`);
  const dateLine = getSubscriptionDateLine(subscription);
  const dateText =
    dateLine &&
    t(`manage.subscription.${dateLine.key}`, {
      date: formatDate(dateLine.date),
    });
  // Staff can see the problem but not fix it, so tell them who can.
  const reason = hasSubscriptionProblem(status)
    ? [
        t(`manage.subscription.reasons.${status.toLowerCase()}`),
        !isOwner && t("manage.subscription.ownerOnly"),
      ]
        .filter(Boolean)
        .join(" ")
    : null;
  // Same hue as the status pill, so the reason reads as part of it.
  const reasonColor = tw.style(
    labelSolidStyles[SUBSCRIPTION_STATUS_COLOR[status]].text,
  );

  const accessibilityLabel = [plan?.name, statusText, dateText, reason]
    .filter(Boolean)
    .join(". ");

  const content = (
    <ThemedView style={tw`flex-row items-center gap-3 min-h-16 py-2`}>
      <ThemedView style={tw`flex-1 gap-1`}>
        <ThemedView style={tw`flex-row flex-wrap items-center gap-2`}>
          {plan?.name && <ThemedText>{plan.name}</ThemedText>}
          <SubscriptionStatusLabel status={status} />
        </ThemedView>
        {dateText && <ThemedText type="small">{dateText}</ThemedText>}
        {reason && (
          <ThemedView style={tw`flex-row items-start gap-2 mt-1`}>
            {/* mt-0.5 centers the icon on the first 20px line */}
            <Icon
              name="circle-alert"
              size={16}
              color={reasonColor.color as string}
              style={tw`mt-0.5`}
            />
            <ThemedText type="body2" style={[tw`flex-1`, reasonColor]}>
              {reason}
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
      {isOwner && <Icon name="chevron-right" size={18} />}
    </ThemedView>
  );

  if (!isOwner) {
    return (
      <ThemedView accessible accessibilityLabel={accessibilityLabel}>
        {content}
      </ThemedView>
    );
  }

  return (
    <Pressable
      onPress={() => router.push("/(profile)/restaurant/subscription")}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [pressed && tw`opacity-60`]}
    >
      {content}
    </Pressable>
  );
}

export default function RestaurantInfoScreen() {
  const { t } = useTranslation("auth");
  const navigation = useNavigation();
  const { user, currentRestaurant } = useAuthStore();

  const canEdit = isAdminLevelRole(user?.role?.name);
  const isOwner = user?.role?.name === Roles.OWNER;
  const subscription = currentRestaurant?.subscription;

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

  // Not loaded yet: a spinner instead of five false "Not set" rows.
  if (!currentRestaurant) {
    return (
      <ScreenLayout style={tw`flex-1 items-center justify-center`}>
        <ActivityIndicator color={tw.color("primary")} />
      </ScreenLayout>
    );
  }

  const openUrl = (url: string) =>
    Linking.openURL(url).catch(() => toast.error(t("manage.info.openFailed")));

  // Editors get an "Add" link on empty values; everyone else sees "Not set".
  const emptyProps = (field: EditableField) => ({
    placeholder: t("manage.notSet"),
    addLabel: t("manage.info.add"),
    onAdd: canEdit ? () => editField(field) : undefined,
  });

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-2`}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedView style={tw`gap-8 pb-8`}>
          {/* Title */}
          <ThemedView style={tw`gap-1`}>
            <ThemedText type="h1">{currentRestaurant.name}</ThemedText>
            {currentRestaurant.parentRestaurant && (
              <ThemedText type="body2" style={tw`text-gray-500`}>
                {t("createBranch.branchOf", {
                  name: currentRestaurant.parentRestaurant.name,
                })}
              </ThemedText>
            )}
          </ThemedView>

          {subscription && (
            <InfoSection title={t("manage.subscription.title")}>
              <SubscriptionSummary
                subscription={subscription}
                isOwner={isOwner}
              />
            </InfoSection>
          )}

          <InfoSection title={t("manage.info.contact")}>
            <InfoRow
              label={t("createRestaurant.phone")}
              value={currentRestaurant.phone}
              action={{
                icon: "phone",
                label: t("manage.info.call"),
                onPress: () =>
                  openUrl(`tel:${currentRestaurant.phone.replace(/\s+/g, "")}`),
              }}
              {...emptyProps("phone")}
            />
            <InfoRow
              label={t("createRestaurant.email")}
              value={currentRestaurant.email}
              action={{
                icon: "mail",
                label: t("manage.info.sendEmail"),
                onPress: () => openUrl(`mailto:${currentRestaurant.email}`),
              }}
              {...emptyProps("email")}
            />
            <InfoRow
              label={t("createRestaurant.address")}
              value={currentRestaurant.address}
              {...emptyProps("address")}
            />
          </InfoSection>

          <InfoSection title={t("manage.info.business")}>
            <InfoRow
              label={t("editRestaurant.identification")}
              value={currentRestaurant.identification}
              {...emptyProps("identification")}
            />
            <InfoRow
              label={t("editRestaurant.capacity")}
              value={currentRestaurant.capacity}
              {...emptyProps("capacity")}
            />
          </InfoSection>

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
