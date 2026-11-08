import { useCallback, useRef, useState } from "react";
import { Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";

import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { typography } from "@/constants/theme";
import tw from "@/presentation/theme/lib/tailwind";
import Card from "@/presentation/theme/components/card";
import Icon from "@/presentation/theme/components/icon";
import IconButton from "@/presentation/theme/components/icon-button";
import Label from "@/presentation/theme/components/label";
import ProgressBar from "@/presentation/theme/components/progress-bar";
import Button from "@/presentation/theme/components/button";
import ActionsBottomSheet from "@/presentation/theme/components/actions-bottom-sheet";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { useOnboarding } from "@/presentation/onboarding/hooks/useOnboarding";
import type { OnboardingStepDefinition } from "@/presentation/onboarding/onboarding-steps";

interface OnboardingChecklistCardProps {
  /** Opens the new-order sheet for the "first order" step. */
  onStartOrder: () => void;
}

/**
 * "Primeros pasos" card at the top of Inicio, only for the owner of a
 * restaurant that hasn't finished or hidden it. Collapsed it shows the next
 * step; open it lists them all, done ones first.
 */
export default function OnboardingChecklistCard({
  onStartOrder,
}: OnboardingChecklistCardProps) {
  const { t } = useTranslation("onboarding");
  const onboarding = useOnboarding();
  const [expanded, setExpanded] = useState(false);
  const optionsRef = useRef<BottomSheetMethods>(null);
  const { visible, refetch } = onboarding;

  // Back on Inicio: steps the server works out (printer, team, first order)
  // may have changed.
  useFocusEffect(
    useCallback(() => {
      if (visible) refetch();
    }, [visible, refetch]),
  );

  if (!visible) return null;

  const required = onboarding.steps.filter((step) => !step.optional);
  const optional = onboarding.steps.filter((step) => step.optional);
  const ordered = [
    ...required.filter((step) => step.done),
    ...required.filter((step) => !step.done),
    ...optional,
  ];
  const nextStep = required.find((step) => !step.done);
  const pendingOptional = optional.filter((step) => !step.done).length;
  const rows = expanded ? ordered : nextStep ? [nextStep] : [];

  const openStep = (step: OnboardingStepDefinition) => {
    if (step.href) router.push(step.href);
    else onStartOrder();
  };

  const hide = () => {
    optionsRef.current?.close();
    onboarding.hide.mutate();
  };

  return (
    <ThemedView style={tw`px-4 pt-3`}>
      <Card variant="default" style={tw`p-4 gap-3`}>
        <ThemedView style={tw`flex-row items-center gap-2`}>
          <Pressable
            style={tw`flex-1 flex-row items-center gap-2`}
            onPress={() => setExpanded((value) => !value)}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={t("card.title")}
          >
            <ThemedText type="h4" style={tw`flex-1`}>
              {onboarding.allRequiredDone ? t("card.allDone") : t("card.title")}
            </ThemedText>
            <ThemedText type="small">
              {t("card.progress", {
                done: onboarding.doneRequired,
                total: onboarding.totalRequired,
              })}
            </ThemedText>
            <Icon name={expanded ? "chevron-up" : "chevron-down"} size={20} />
          </Pressable>
          <IconButton
            icon="ellipsis-vertical"
            size={20}
            style={tw`p-1`}
            accessibilityLabel={t("card.options")}
            onPress={() => optionsRef.current?.present()}
          />
        </ThemedView>

        <ProgressBar
          progress={onboarding.doneRequired / onboarding.totalRequired}
          height={1}
        />

        {onboarding.allRequiredDone ? (
          <ThemedView style={tw`gap-3`}>
            <ThemedText type="body2">{t("card.allDoneMessage")}</ThemedText>
            <ThemedView style={tw`flex-row justify-end`}>
              <Button
                size="small"
                label={t("card.close")}
                onPress={hide}
                loading={onboarding.hide.isPending}
              />
            </ThemedView>
          </ThemedView>
        ) : (
          <ThemedView style={tw`gap-1`}>
            {rows.map((step) => (
              <Pressable
                key={step.key}
                onPress={() => openStep(step)}
                style={({ pressed }) => [
                  tw`flex-row items-center gap-3 py-2`,
                  pressed && tw`opacity-80`,
                ]}
                accessibilityRole="button"
                accessibilityState={{ checked: step.done }}
              >
                <ThemedView
                  style={tw.style(
                    `w-6 h-6 rounded-full items-center justify-center`,
                    step.done ? `bg-primary` : `border border-outline-variant`,
                  )}
                >
                  {step.done && (
                    <Icon
                      name="check"
                      size={14}
                      color={tw.color("on-primary")}
                    />
                  )}
                </ThemedView>
                <ThemedText
                  style={[
                    tw.style(
                      `flex-1`,
                      step.done && `text-gray-500 line-through`,
                    ),
                    { fontFamily: typography.medium },
                  ]}
                >
                  {t(`steps.${step.key}.title`)}
                </ThemedText>
                {step.optional && !step.done && (
                  <Label text={t("card.optional")} size="small" />
                )}
                {!step.done && (
                  <Icon
                    name="chevron-right"
                    size={18}
                    color={tw.color("primary")}
                  />
                )}
              </Pressable>
            ))}
            {!expanded && pendingOptional > 0 && (
              <ThemedText type="small">
                {t("card.optionalLeft", { count: pendingOptional })}
              </ThemedText>
            )}
          </ThemedView>
        )}
      </Card>

      <ThemedBottomSheetModal ref={optionsRef} enablePanDownToClose>
        <ActionsBottomSheet
          title={t("card.title")}
          items={[
            {
              icon: "eye-off",
              label: t("card.hide"),
              hint: t("card.hideHint"),
              onPress: hide,
            },
          ]}
        />
      </ThemedBottomSheetModal>
    </ThemedView>
  );
}
