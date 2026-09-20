import { ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Card from "@/presentation/theme/components/card";
import Label from "@/presentation/theme/components/label";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { usePlans } from "@/presentation/subscriptions/hooks/usePlans";
import {
  PlanLimitResource,
  type Plan,
} from "@/core/common/models/restaurant.model";

const STATUS_COLOR: Record<
  string,
  "success" | "info" | "error" | "default"
> = {
  ACTIVE: "success",
  TRIAL: "info",
  EXPIRED: "error",
  CANCELLED: "error",
};

export default function SubscriptionScreen() {
  const { t } = useTranslation("auth");
  const { currentRestaurant } = useAuthStore();
  const subscription = currentRestaurant?.subscription;

  const plansQuery = usePlans();
  const plans = [...(plansQuery.data ?? [])].sort(
    (a, b) => Number(a.price) - Number(b.price),
  );

  const formatLimit = (limit: number) =>
    limit === -1 ? t("manage.subscription.unlimited") : String(limit);

  const resourceLabel = (resource: PlanLimitResource) =>
    t(`manage.subscription.resources.${resource}`);

  const isCurrentPlan = (plan: Plan) => subscription?.plan?.id === plan.id;

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-2`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-6 pb-8`}
      >
        {subscription && (
          <ThemedView style={tw`gap-3`}>
            <ThemedText type="small" style={tw`text-gray-500`}>
              {t("manage.subscription.currentPlan")}
            </ThemedText>
            <Card variant="outline">
              <ThemedView style={tw`gap-3`}>
                <ThemedView
                  style={tw`flex-row items-center justify-between`}
                >
                  <ThemedText type="h3">{subscription.plan?.name}</ThemedText>
                  <Label
                    text={t(
                      `manage.subscription.${subscription.status.toLowerCase()}`,
                    )}
                    color={STATUS_COLOR[subscription.status] ?? "default"}
                    size="small"
                  />
                </ThemedView>

                {subscription.status === "TRIAL" &&
                  subscription.trialEndsAt && (
                    <ThemedView style={tw`flex-row items-center gap-2`}>
                      <Ionicons name="time-outline" size={16} />
                      <ThemedText type="body2" style={tw`text-gray-500`}>
                        {t("manage.subscription.trialEnds", {
                          date: new Date(
                            subscription.trialEndsAt,
                          ).toLocaleDateString(),
                        })}
                      </ThemedText>
                    </ThemedView>
                  )}

                {subscription.currentPeriodEnd && (
                  <ThemedView style={tw`flex-row items-center gap-2`}>
                    <Ionicons name="calendar-outline" size={16} />
                    <ThemedText type="body2" style={tw`text-gray-500`}>
                      {t("manage.subscription.periodEnds")}:{" "}
                      {new Date(
                        subscription.currentPeriodEnd,
                      ).toLocaleDateString()}
                    </ThemedText>
                  </ThemedView>
                )}
              </ThemedView>
            </Card>
          </ThemedView>
        )}

        <ThemedView style={tw`gap-3`}>
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("manage.subscription.availablePlans")}
          </ThemedText>

          {plansQuery.isLoading && (
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("manage.subscription.loadingPlans")}
            </ThemedText>
          )}

          <ThemedView style={tw`gap-4`}>
            {plans.map((plan) => {
              const current = isCurrentPlan(plan);
              return (
                <Card
                  key={plan.id}
                  variant="outline"
                  style={
                    current &&
                    tw`border-light-primary border-2 bg-light-primary/5`
                  }
                >
                  <ThemedView style={tw`gap-4`}>
                    <ThemedView
                      style={tw`flex-row items-center justify-between`}
                    >
                      <ThemedText type="h3">{plan.name}</ThemedText>
                      {current && (
                        <Label
                          text={t("manage.subscription.yourPlan")}
                          color="primary"
                          size="small"
                        />
                      )}
                    </ThemedView>

                    <ThemedView style={tw`flex-row items-baseline gap-1`}>
                      <ThemedText type="h1">
                        ${Number(plan.price).toFixed(0)}
                      </ThemedText>
                      <ThemedText type="body2" style={tw`text-gray-500`}>
                        {t("manage.subscription.perMonth")}
                      </ThemedText>
                    </ThemedView>

                    {plan.description && (
                      <ThemedText type="body2" style={tw`text-gray-500`}>
                        {plan.description}
                      </ThemedText>
                    )}

                    <ThemedView style={tw`gap-2`}>
                      {(plan.limits ?? [])
                        .slice()
                        .sort((a, b) =>
                          resourceLabel(a.resource).localeCompare(
                            resourceLabel(b.resource),
                          ),
                        )
                        .map((limit) => (
                          <ThemedView
                            key={limit.id}
                            style={tw`flex-row items-center gap-2`}
                          >
                            <Ionicons
                              name="checkmark-circle"
                              size={18}
                              color={tw.color("green-500")}
                            />
                            <ThemedText type="body2">
                              {formatLimit(limit.limit)}{" "}
                              {resourceLabel(limit.resource)}
                            </ThemedText>
                          </ThemedView>
                        ))}
                    </ThemedView>
                  </ThemedView>
                </Card>
              );
            })}
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </ScreenLayout>
  );
}
