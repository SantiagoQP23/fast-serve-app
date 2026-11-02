import { useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, Share, View } from "react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { toast } from "sonner-native";
import { queryClient } from "@/app/_layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import Button from "@/presentation/theme/components/button";
import Label from "@/presentation/theme/components/label";
import Icon from "@/presentation/theme/components/icon";
import Card from "@/presentation/theme/components/card";
import Switch from "@/presentation/theme/components/switch";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { getErrorMessage } from "@/core/api/get-error-message";
import { typography } from "@/constants/theme";
import { AuthorizationCodesService } from "@/core/orders/authorization/authorization-codes.service";
import {
  AuthorizationAction,
  AuthorizationCode,
} from "@/core/orders/authorization/authorization-code.model";
import { useRestaurantSettings } from "@/presentation/restaurant/hooks/useRestaurantSettings";
import { DEFAULT_REQUIRE_CODE_TO_REMOVE_ITEMS } from "@/core/restaurant/models/restaurant-settings.model";

const QUERY_KEY = "authorization-codes";

/** "482915" → "482 915", easier to read out loud. */
const spaced = (code: string) => `${code.slice(0, 3)} ${code.slice(3)}`;

const isActive = (code: AuthorizationCode, now: number) =>
  !code.usedAt && !code.voidedAt && dayjs(code.expiresAt).valueOf() > now;

/** Ticks every second while something counts down. */
const useNow = (enabled: boolean) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [enabled]);
  return now;
};

export default function AuthorizationCodesScreen() {
  const { t } = useTranslation(["orders", "common"]);
  const { user, currentRestaurant } = useAuthStore();
  const restaurantId = currentRestaurant?.id;
  const isAdmin = isAdminLevelRole(user?.role?.name);
  const { settings, updateSettings } = useRestaurantSettings();

  // While saving, show the new value so the switch doesn't jump back.
  const pendingRequireCode = updateSettings.isPending
    ? updateSettings.variables?.REQUIRE_CODE_TO_REMOVE_ITEMS
    : undefined;
  const requireCode =
    typeof pendingRequireCode === "boolean"
      ? pendingRequireCode
      : (settings?.REQUIRE_CODE_TO_REMOVE_ITEMS ??
        DEFAULT_REQUIRE_CODE_TO_REMOVE_ITEMS);

  // Today, in the phone's time zone.
  const [day] = useState(() => ({
    from: dayjs().startOf("day").toISOString(),
    to: dayjs().endOf("day").toISOString(),
  }));

  const query = useQuery({
    queryKey: [QUERY_KEY, restaurantId, day.from],
    queryFn: () =>
      AuthorizationCodesService.findAll(day.from, dayjs().toISOString()),
    enabled: !!restaurantId && isAdmin,
  });
  const codes = useMemo(() => query.data ?? [], [query.data]);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY, restaurantId] });

  const generate = useMutation({
    mutationFn: () => AuthorizationCodesService.generate(),
    onSuccess: () => refresh(),
    onError: (error) =>
      toast.error(
        getErrorMessage(error, {
          fallback: t("orders:authorization.generateError"),
        }),
      ),
  });

  const voidCode = useMutation({
    mutationFn: (id: string) => AuthorizationCodesService.void(id),
    onSuccess: () => refresh(),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  // Ticks while some code may still be counting down.
  const now = useNow(codes.some((code) => !code.usedAt && !code.voidedAt));
  const active = codes.find((code) => isActive(code, now));
  const remaining = active
    ? Math.max(0, dayjs(active.expiresAt).valueOf() - now)
    : 0;
  const seconds = Math.ceil(remaining / 1000);
  const countdown = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  const shareCode = (code: AuthorizationCode) =>
    Share.share({
      message: t("orders:authorization.shareMessage", {
        code: spaced(code.code),
        restaurant: currentRestaurant?.name ?? "",
      }),
    });

  const orderPlace = (code: AuthorizationCode) => {
    if (!code.order) return "";
    const num = t("orders:authorization.orderNumber", { num: code.order.num });
    return code.order.table?.name
      ? `${num} · ${t("orders:details.table")} ${code.order.table.name}`
      : `${num} · ${t("orders:details.takeAway")}`;
  };

  const usageText = (code: AuthorizationCode) => {
    const name = code.usedBy?.person?.firstName ?? "";
    const product = code.productName ?? "";
    switch (code.action) {
      case AuthorizationAction.DELETE_ITEM:
        return t("orders:authorization.usage.deleteItem", {
          name,
          count: Number(code.quantityBefore ?? 0),
          product,
        });
      case AuthorizationAction.DECREASE_QUANTITY:
        return t("orders:authorization.usage.decrease", {
          name,
          product,
          from: Number(code.quantityBefore ?? 0),
          to: Number(code.quantityAfter ?? 0),
        });
      case AuthorizationAction.REPLACE_ITEM:
        return t("orders:authorization.usage.replace", { name, product });
      case AuthorizationAction.CANCEL_ORDER:
        return t("orders:authorization.usage.cancelOrder", { name });
      default:
        return t("orders:authorization.usage.used", { name });
    }
  };

  const statusLabel = (code: AuthorizationCode) => {
    if (code.usedAt) return null;
    if (code.voidedAt)
      return (
        <Label text={t("orders:authorization.status.voided")} size="small" />
      );
    if (isActive(code, now))
      return (
        <Label
          text={t("orders:authorization.status.active")}
          size="small"
          color="success"
        />
      );
    return (
      <Label text={t("orders:authorization.status.expired")} size="small" />
    );
  };

  if (!isAdmin) {
    return (
      <ScreenLayout style={tw`flex-1 items-center justify-center px-8`}>
        <ThemedText type="body1" style={tw`text-center text-gray-500`}>
          {t("orders:authorization.onlyAdmins")}
        </ThemedText>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-4`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-10 gap-3`}
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={refresh} />
        }
      >
        <Card style={tw`gap-1 p-4 rounded-3xl`}>
          <Switch
            label={t("orders:authorization.requireCode.title")}
            value={requireCode}
            onValueChange={(value) =>
              updateSettings.mutate({ REQUIRE_CODE_TO_REMOVE_ITEMS: value })
            }
            disabled={!settings || updateSettings.isPending}
          />
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("orders:authorization.requireCode.description")}
          </ThemedText>
        </Card>

        <ThemedView
          style={tw`rounded-md border border-border px-4 py-6 items-center gap-1`}
        >
          {active ? (
            <>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("orders:authorization.giveCode")}
              </ThemedText>
              <ThemedText
                selectable
                accessibilityLabel={active.code.split("").join(" ")}
                style={{
                  fontFamily: typography.bold,
                  fontSize: 46,
                  lineHeight: 56,
                  letterSpacing: 6,
                }}
              >
                {spaced(active.code)}
              </ThemedText>
              <ThemedText type="body2" style={tw`text-gray-500`}>
                {t("orders:authorization.expiresIn", { time: countdown })}
              </ThemedText>
            </>
          ) : (
            <>
              <Icon name="key-round" size={36} />
              <ThemedText
                type="body2"
                style={tw`text-center text-gray-500 mt-2`}
              >
                {t("orders:authorization.noActiveCode")}
              </ThemedText>
            </>
          )}
        </ThemedView>

        {active && (
          <View style={tw`flex-row gap-2`}>
            <View style={tw`flex-1`}>
              <Button
                label={t("orders:authorization.share")}
                leftIcon="share-2"
                variant="outline"
                onPress={() => shareCode(active)}
              />
            </View>
            <View style={tw`flex-1`}>
              <Button
                label={t("orders:authorization.void")}
                leftIcon="ban"
                variant="outline"
                loading={voidCode.isPending}
                disabled={voidCode.isPending}
                onPress={() => voidCode.mutate(active.id)}
              />
            </View>
          </View>
        )}

        <Button
          label={
            active
              ? t("orders:authorization.generateAnother")
              : t("orders:authorization.generateCode")
          }
          leftIcon="key-round"
          loading={generate.isPending}
          disabled={generate.isPending}
          onPress={() => generate.mutate()}
        />

        <ThemedText type="small" style={tw`text-gray-500 mt-4`}>
          {t("orders:authorization.today")}
        </ThemedText>

        {query.isError && (
          <ThemedText type="body2" style={tw`text-red-500`}>
            {t("orders:authorization.loadError")}
          </ThemedText>
        )}

        {!query.isLoading && !query.isError && codes.length === 0 && (
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {t("orders:authorization.noCodesToday")}
          </ThemedText>
        )}

        {codes.map((code) => (
          <ThemedView
            key={code.id}
            style={tw`border-b border-divider py-3 gap-1`}
          >
            <ThemedView style={tw`flex-row items-center justify-between gap-2`}>
              <ThemedText
                type="body1"
                style={[tw`flex-1`, { fontFamily: typography.medium }]}
              >
                {code.usedAt
                  ? usageText(code)
                  : t("orders:authorization.codeTitle", {
                      code: spaced(code.code),
                    })}
              </ThemedText>
              {statusLabel(code) ?? (
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {dayjs(code.usedAt).format("HH:mm")}
                </ThemedText>
              )}
            </ThemedView>
            <ThemedText type="small" style={tw`text-gray-500`}>
              {[
                code.usedAt ? orderPlace(code) : null,
                code.usedAt
                  ? t("orders:authorization.codeShort", {
                      code: spaced(code.code),
                    })
                  : t("orders:authorization.createdAt", {
                      time: dayjs(code.createdAt).format("HH:mm"),
                    }),
                code.createdBy?.id !== user?.id && code.createdBy?.person
                  ? t("orders:authorization.by", {
                      name: code.createdBy.person.firstName,
                    })
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </ThemedText>
          </ThemedView>
        ))}
      </ScrollView>
    </ScreenLayout>
  );
}
