import { RefreshControl, ScrollView } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Label from "@/presentation/theme/components/label";
import ProgressBar from "@/presentation/theme/components/progress-bar";
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import InventoryDetailTitle, {
  formatDetailMoment,
} from "@/presentation/inventory/components/inventory-detail-title";
import InventorySectionHeader from "@/presentation/inventory/components/inventory-section-header";
import InventoryActivity from "@/presentation/inventory/components/inventory-activity";
import CountLineCard from "@/presentation/inventory/components/count-line-card";
import CountFinishButton from "@/presentation/inventory/components/count-finish-button";
import { useInventoryCount } from "@/presentation/inventory/hooks/useInventoryCounts";
import {
  InventoryCountItemStatus,
  InventoryCountStatus,
  getCountUserName,
  isCountItemAnswered,
  type InventoryCountItem,
} from "@/core/inventory/models/inventory-count.model";

interface InventoryCountDetailViewProps {
  countId: string;
  /**
   * Rendered as a pane next to the counts list (tablet): shows a close button
   * and opens the count run on top instead of replacing this screen.
   */
  embedded?: boolean;
  onClose?: () => void;
}

/** Summary of a count in progress (continue, add, finish) or the read-only record of a finished one. */
export default function InventoryCountDetailView({
  countId,
  embedded = false,
  onClose,
}: InventoryCountDetailViewProps) {
  const { t } = useTranslation("inventory");
  const { count, countQuery } = useInventoryCount(countId);
  const Container = embedded ? ThemedView : ScreenLayout;
  const insets = useSafeAreaInsets();

  const lines = count?.items ?? [];
  const inProgress = count?.status === InventoryCountStatus.IN_PROGRESS;
  const toCount = lines.filter(
    (line) => line.status === InventoryCountItemStatus.PENDING,
  );
  const reviewed = lines.filter(
    (line) => line.status !== InventoryCountItemStatus.PENDING,
  );
  const hasPending = toCount.length > 0;
  // Progress counts answers only — skipped lines still need one, matching
  // the count card's pendingCount and the finish confirmation.
  const answeredCount = lines.filter(isCountItemAnswered).length;
  const adjustedCount = lines.filter(
    (line) => line.status === InventoryCountItemStatus.ADJUSTED,
  ).length;
  const creator = count ? getCountUserName(count.createdBy) : null;
  const finisher = count ? getCountUserName(count.completedBy) : null;

  const activity = count
    ? [
        {
          label: creator
            ? t("counts.startedBy", { name: creator })
            : t("activity.started"),
          date: count.createdAt,
        },
        ...(count.completedAt
          ? [
              {
                label: finisher
                  ? t("activity.finishedBy", { name: finisher })
                  : t("activity.finished"),
                date: count.completedAt,
              },
            ]
          : []),
      ]
    : [];

  // As its own screen the summary is swapped for the run; embedded, the
  // run opens on top so the list stays underneath.
  const openRun = (line?: InventoryCountItem) => {
    const route = {
      pathname: "/(profile)/inventory/counts/run",
      params: line ? { countId, lineId: line.id } : { countId },
    } as const;
    if (embedded) router.push(route);
    else router.replace(route);
  };

  const addProducts = () =>
    router.push({
      pathname: "/(profile)/inventory/counts/items",
      params: { countId },
    });

  const renderLines = (group: InventoryCountItem[]) => (
    <ThemedView style={tw`gap-2 bg-transparent`}>
      {group.map((line) => (
        <CountLineCard
          key={line.id}
          line={line}
          onPress={inProgress ? () => openRun(line) : undefined}
        />
      ))}
    </ThemedView>
  );

  // The tap-to-count hint goes under whichever group comes first
  const hint = inProgress ? t("counts.summaryHint") : undefined;

  return (
    <Container style={tw`flex-1 bg-background`}>
      <ThemedView style={tw`px-4 ${embedded ? "pt-2" : "pt-6"} bg-transparent`}>
        <InventoryScreenHeader
          onBack={onClose}
          backIcon={embedded ? "x" : "arrow-left"}
          right={
            inProgress ? (
              <Button
                leftIcon="plus"
                label={t("counts.addProducts")}
                variant="outline"
                size="extra-small"
                onPress={addProducts}
              />
            ) : undefined
          }
        />
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 gap-6 pb-10 pt-6`}
        refreshControl={
          <RefreshControl
            refreshing={countQuery.isRefetching}
            onRefresh={countQuery.refetch}
          />
        }
      >
        {countQuery.isLoading && (
          <ThemedText type="body1" style={tw`text-gray-500 text-center py-8`}>
            {t("loading")}
          </ThemedText>
        )}

        {countQuery.isError && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="circle-alert" size={48} color={tw.color("red-500")} />
            <ThemedText type="body1" style={tw`text-red-500`}>
              {t("counts.notFound")}
            </ThemedText>
            <Button
              label={t("retry")}
              onPress={() => countQuery.refetch()}
              variant="outline"
            />
          </ThemedView>
        )}

        {count && (
          <>
            <InventoryDetailTitle
              icon="clipboard"
              title={t("counts.name")}
              subtitle={formatDetailMoment(count.createdAt)}
              labels={
                <>
                  <Label
                    text={t(`counts.countStatus.${count.status}`)}
                    color={inProgress ? "info" : "success"}
                    size="small"
                  />
                  {adjustedCount > 0 && (
                    <Label
                      text={t("counts.adjustedCount", { count: adjustedCount })}
                      color="warning"
                      size="small"
                    />
                  )}
                </>
              }
            >
              {inProgress && lines.length > 0 && (
                <ThemedView
                  style={tw`flex-row items-center gap-3 bg-transparent`}
                >
                  <ThemedView style={tw`flex-1 bg-transparent`}>
                    <ProgressBar
                      progress={answeredCount / lines.length}
                      height={1.5}
                    />
                  </ThemedView>
                  <ThemedText
                    type="small"
                    style={[
                      tw`text-on-surface-variant`,
                      { fontVariant: ["tabular-nums"] },
                    ]}
                  >
                    {answeredCount}/{lines.length}
                  </ThemedText>
                </ThemedView>
              )}
            </InventoryDetailTitle>

            {hasPending && (
              <ThemedView style={tw`gap-4 bg-transparent`}>
                <InventorySectionHeader
                  title={t("counts.toCount")}
                  count={toCount.length}
                  highlight
                  hint={hint}
                />
                {renderLines(toCount)}
              </ThemedView>
            )}

            {reviewed.length > 0 && (
              <ThemedView style={tw`gap-4 bg-transparent`}>
                <InventorySectionHeader
                  title={t("counts.reviewed")}
                  count={reviewed.length}
                  hint={hasPending ? undefined : hint}
                />
                {renderLines(reviewed)}
              </ThemedView>
            )}

            <InventoryActivity entries={activity} />
          </>
        )}
      </ScrollView>

      {inProgress && (
        <ThemedView
          style={[
            tw`flex-row items-center gap-3 px-4 pt-3 border-t border-divider bg-background`,
            { paddingBottom: embedded ? 16 : Math.max(insets.bottom, 16) },
          ]}
        >
          <CountFinishButton
            countId={countId}
            size={hasPending ? "small" : "medium"}
            style={tw`flex-1`}
          />
          {hasPending && (
            <Button
              leftIcon="play"
              label={t("counts.continue")}
              size="small"
              onPress={() => openRun()}
              style={tw`flex-[1.4]`}
            />
          )}
        </ThemedView>
      )}
    </Container>
  );
}
