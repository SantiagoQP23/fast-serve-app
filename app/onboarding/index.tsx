import { useContext, useEffect, useState } from "react";
import { BackHandler, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";

import { queryClient } from "@/app/_layout";
import { ROUTES } from "@/constants/routes";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { RestaurantService } from "@/core/restaurant/services/restaurant.service";
import { getErrorMessage } from "@/core/api/get-error-message";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useRestaurantMenuStoreRefresh } from "@/presentation/onboarding/hooks/useRestaurantMenuStoreRefresh";
import { ONBOARDING_STEPS } from "@/presentation/onboarding/onboarding-steps";
import { usePaymentMethodsStore } from "@/presentation/restaurant/store/usePaymentMethodsStore";
import { useProductionAreasStore } from "@/presentation/production-areas/store/useProductionAreasStore";
import { useTablesStore } from "@/presentation/tables/hooks/useTablesStore";
import { SocketContext } from "@/presentation/shared/context/SocketContext";
import tw from "@/presentation/theme/lib/tailwind";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import Label from "@/presentation/theme/components/label";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";

type MenuStart = "empty" | "sample";
const PAGES = 3;

/**
 * Three short screens shown to the owner right after creating a restaurant:
 * what's already set up, how to start the menu, and the first steps that
 * stay on Inicio as a checklist.
 */
export default function OnboardingScreen() {
  const { t } = useTranslation("onboarding");
  const insets = useSafeAreaInsets();
  const { online } = useContext(SocketContext);
  const currentRestaurant = useAuthStore((state) => state.currentRestaurant);
  const tables = useTablesStore((state) => state.tables);
  const areas = useProductionAreasStore((state) => state.productionAreas);
  const paymentMethods = usePaymentMethodsStore(
    (state) => state.paymentMethods,
  );
  const refreshMenu = useRestaurantMenuStoreRefresh();

  const [page, setPage] = useState(0);
  const [menuStart, setMenuStart] = useState<MenuStart>("empty");
  const [menuError, setMenuError] = useState<string | null>(null);

  const goHome = () => router.replace(ROUTES.APP.MY_ORDERS);

  // Android back walks the pages, then leaves for Inicio.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (page > 0) setPage(page - 1);
      else goHome();
      return true;
    });
    return () => sub.remove();
  }, [page]);

  const clearSampleMenu = useMutation({
    mutationFn: RestaurantService.clearSampleMenu,
    onSuccess: async () => {
      await refreshMenu();
      queryClient.invalidateQueries({ queryKey: ["onboarding"] });
    },
  });

  const continueFromMenu = async () => {
    setMenuError(null);
    if (menuStart === "empty") {
      try {
        await clearSampleMenu.mutateAsync();
      } catch (error) {
        setMenuError(getErrorMessage(error, { fallback: t("menu.error") }));
        return;
      }
    }
    setPage(2);
  };

  const trialDays = currentRestaurant?.subscription?.trialEndsAt
    ? Math.max(
        dayjs(currentRestaurant.subscription.trialEndsAt).diff(dayjs(), "day"),
        0,
      )
    : null;

  const summary: { icon: IconName; text: string }[] = [
    {
      icon: "layout-grid",
      text: t("welcome.tables", { count: tables.length }),
    },
    {
      icon: "chef-hat",
      text: t("welcome.areas", {
        names: areas.map((area) => area.name).join(", "),
      }),
    },
    {
      icon: "credit-card",
      text: t("welcome.paymentMethods", {
        names: paymentMethods.map((method) => method.name).join(", "),
      }),
    },
    ...(trialDays
      ? [
          {
            icon: "sparkles" as IconName,
            text: t("welcome.trial", { count: trialDays }),
          },
        ]
      : []),
  ];

  const menuOptions: { value: MenuStart; title: string; body: string }[] = [
    {
      value: "empty",
      title: t("menu.empty.title"),
      body: t("menu.empty.body"),
    },
    {
      value: "sample",
      title: t("menu.sample.title"),
      body: t("menu.sample.body"),
    },
  ];

  return (
    <ScreenLayout style={[tw`flex-1 px-4`, { paddingTop: insets.top + 16 }]}>
      <ThemedView
        style={tw`flex-row justify-center gap-1.5`}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 1, max: PAGES, now: page + 1 }}
      >
        {Array.from({ length: PAGES }).map((_, index) => (
          <ThemedView
            key={index}
            style={tw.style(
              `w-5 h-1 rounded-full`,
              index <= page ? `bg-primary` : `bg-outline-variant`,
            )}
          />
        ))}
      </ThemedView>

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`gap-4 pt-8 pb-4`}
        showsVerticalScrollIndicator={false}
      >
        {page === 0 && (
          <>
            <ThemedText type="h2">
              {t("welcome.title", { name: currentRestaurant?.name ?? "" })}
            </ThemedText>
            <ThemedText type="body2">{t("welcome.body")}</ThemedText>
            <Card variant="default" style={tw`p-4 gap-4`}>
              {summary.map((row) => (
                <ThemedView
                  key={row.icon}
                  style={tw`flex-row items-center gap-3`}
                >
                  <Icon name={row.icon} size={20} />
                  <ThemedText style={tw`flex-1`}>{row.text}</ThemedText>
                </ThemedView>
              ))}
            </Card>
          </>
        )}

        {page === 1 && (
          <>
            <ThemedText type="h2">{t("menu.title")}</ThemedText>
            {menuOptions.map((option) => {
              const selected = menuStart === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setMenuStart(option.value);
                    setMenuError(null);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={tw.style(
                    `flex-row gap-3 p-4 rounded-md border border-primary`,
                    selected && `bg-secondary`,
                  )}
                >
                  <ThemedView
                    style={tw`mt-0.5 w-5 h-5 rounded-full border-2 border-primary items-center justify-center bg-transparent`}
                  >
                    {selected && (
                      <ThemedView
                        style={tw`w-2.5 h-2.5 rounded-full bg-primary`}
                      />
                    )}
                  </ThemedView>
                  <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
                    <ThemedText type="h4">{option.title}</ThemedText>
                    <ThemedText type="body2">{option.body}</ThemedText>
                  </ThemedView>
                </Pressable>
              );
            })}
            {menuStart === "empty" && online === false && (
              <ThemedText type="small" style={tw`text-red-700`}>
                {t("menu.offline")}
              </ThemedText>
            )}
            {menuError && (
              <ThemedText type="small" style={tw`text-red-700`}>
                {menuError}
              </ThemedText>
            )}
          </>
        )}

        {page === 2 && (
          <>
            <ThemedText type="h2">{t("steps.title")}</ThemedText>
            <ThemedText type="body2">{t("steps.body")}</ThemedText>
            <ThemedView style={tw`gap-1`}>
              {ONBOARDING_STEPS.map((step) => (
                <ThemedView
                  key={step.key}
                  style={tw`flex-row items-center gap-3 rounded-md bg-surface-container-low px-4 py-3`}
                >
                  <Icon name={step.icon} size={20} />
                  <ThemedText style={tw`flex-1`}>
                    {t(`steps.${step.key}.title`)}
                  </ThemedText>
                  {step.optional && (
                    <Label text={t("card.optional")} size="small" />
                  )}
                </ThemedView>
              ))}
            </ThemedView>
          </>
        )}
      </ScrollView>

      <ThemedView style={[tw`gap-2`, { paddingBottom: insets.bottom + 16 }]}>
        {page === 0 && (
          <Button label={t("actions.continue")} onPress={() => setPage(1)} />
        )}
        {page === 1 && (
          <>
            <Button
              label={t("actions.continue")}
              onPress={continueFromMenu}
              loading={clearSampleMenu.isPending}
              disabled={clearSampleMenu.isPending}
            />
            <Button
              variant="text"
              label={t("actions.back")}
              onPress={() => setPage(0)}
            />
          </>
        )}
        {page === 2 && (
          <>
            <Button
              label={t("actions.addFirstProduct")}
              onPress={() => {
                goHome();
                router.push("/(profile)/menu/products/form");
              }}
            />
            <Button
              variant="text"
              label={t("actions.goHome")}
              onPress={goHome}
            />
          </>
        )}
      </ThemedView>
    </ScreenLayout>
  );
}
