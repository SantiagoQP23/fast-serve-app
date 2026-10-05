import { useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatDateTime } from "@/core/i18n/utils";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import Label from "@/presentation/theme/components/label";
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import CountLineCard from "@/presentation/inventory/components/count-line-card";
import { useInventoryCount } from "@/presentation/inventory/hooks/useInventoryCounts";
import {
  InventoryCountItemStatus,
  InventoryCountStatus,
  getCountUserName,
  isCountItemAnswered,
  type InventoryCountItem,
} from "@/core/inventory/models/inventory-count.model";

/** Summary of a count in progress (continue, add, finish) or the read-only record of a finished one. */
export default function MenuInventoryCountDetailScreen() {
  const { t } = useTranslation("inventory");
  const { countId } = useLocalSearchParams<{ countId: string }>();
  const { count, countQuery, complete } = useInventoryCount(countId);
  const [confirmFinish, setConfirmFinish] = useState(false);

  const lines = count?.items ?? [];
  const inProgress = count?.status === InventoryCountStatus.IN_PROGRESS;
  const unanswered = lines.filter((line) => !isCountItemAnswered(line));
  const hasPending = lines.some(
    (line) => line.status === InventoryCountItemStatus.PENDING,
  );
  const adjustedCount = lines.filter(
    (line) => line.status === InventoryCountItemStatus.ADJUSTED,
  ).length;
  const creator = count ? getCountUserName(count.createdBy) : null;
  const finisher = count ? getCountUserName(count.completedBy) : null;

  const openRun = (line?: InventoryCountItem) =>
    router.replace({
      pathname: "/(profile)/menu-inventory-count-run",
      params: line ? { countId, lineId: line.id } : { countId },
    });

  const addProducts = () =>
    router.push({
      pathname: "/(profile)/menu-inventory-count-items",
      params: { countId },
    });

  const finish = () => {
    complete.mutate(undefined, {
      onSettled: () => setConfirmFinish(false),
    });
  };

  const handleFinish = () => {
    if (unanswered.length > 0) setConfirmFinish(true);
    else finish();
  };

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ThemedView style={tw`px-4 pt-8 bg-transparent`}>
        <InventoryScreenHeader title={t("counts.detailTitle")} />
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 gap-4 pb-8 pt-6`}
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
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
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
            <Card>
              <ThemedView style={tw`gap-2 bg-transparent`}>
                <ThemedView
                  style={tw`flex-row justify-between items-center gap-2 bg-transparent`}
                >
                  <ThemedText type="h4" style={tw`flex-1`}>
                    {formatDateTime(count.createdAt)}
                  </ThemedText>
                  <Label
                    text={t(`counts.countStatus.${count.status}`)}
                    color={inProgress ? "info" : "success"}
                    size="small"
                  />
                </ThemedView>
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {t("counts.summaryLine", {
                    products: lines.length,
                    adjusted: adjustedCount,
                    unanswered: unanswered.length,
                  })}
                </ThemedText>
                {creator && (
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {t("counts.startedBy", { name: creator })}
                  </ThemedText>
                )}
                {count.completedAt && (
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {finisher
                      ? t("counts.finishedBy", {
                          name: finisher,
                          date: formatDateTime(count.completedAt),
                        })
                      : t("counts.finishedAt", {
                          date: formatDateTime(count.completedAt),
                        })}
                  </ThemedText>
                )}
              </ThemedView>
            </Card>

            {inProgress && (
              <ThemedView style={tw`gap-3 bg-transparent`}>
                {hasPending && (
                  <Button
                    leftIcon="play-outline"
                    label={t("counts.continue")}
                    onPress={() => openRun()}
                  />
                )}
                <ThemedView style={tw`flex-row gap-3 bg-transparent`}>
                  <Button
                    leftIcon="add-outline"
                    label={t("counts.addProducts")}
                    variant="outline"
                    onPress={addProducts}
                    style={tw`flex-1`}
                  />
                  <Button
                    leftIcon="checkmark-done-outline"
                    label={t("counts.finish")}
                    variant={hasPending ? "outline" : "primary"}
                    loading={complete.isPending && !confirmFinish}
                    onPress={handleFinish}
                    style={tw`flex-1`}
                  />
                </ThemedView>
                <ThemedText type="small" style={tw`text-gray-500 px-1`}>
                  {t("counts.summaryHint")}
                </ThemedText>
              </ThemedView>
            )}

            {lines.map((line) => (
              <CountLineCard
                key={line.id}
                line={line}
                onPress={inProgress ? () => openRun(line) : undefined}
              />
            ))}
          </>
        )}
      </ScrollView>

      <DialogModal
        visible={confirmFinish}
        title={t("counts.finishTitle")}
        message={t("counts.finishMessage", { count: unanswered.length })}
        confirmLabel={t("counts.finish")}
        cancelLabel={t("cancel")}
        loading={complete.isPending}
        onConfirm={finish}
        onCancel={() => setConfirmFinish(false)}
      />
    </ScreenLayout>
  );
}
