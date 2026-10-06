import { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import IconButton from "@/presentation/theme/components/icon-button";
import Label from "@/presentation/theme/components/label";
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import CountQuantityModal from "@/presentation/inventory/components/count-quantity-modal";
import { useInventoryCount } from "@/presentation/inventory/hooks/useInventoryCounts";
import {
  InventoryCountAnswer,
  InventoryCountItemStatus,
  InventoryCountStatus,
  isCountItemAnswered,
  type InventoryCountItem,
} from "@/core/inventory/models/inventory-count.model";

const isPending = (line: InventoryCountItem) =>
  line.status === InventoryCountItemStatus.PENDING;

const DONE = "done";

/** Next pending line after `fromIndex`, wrapping around; null when none is left. */
const findNextPending = (
  lines: InventoryCountItem[],
  fromIndex: number,
): InventoryCountItem | null =>
  lines.slice(fromIndex + 1).find(isPending) ??
  lines.slice(0, fromIndex + 1).find(isPending) ??
  null;

/** Counts one product at a time: "correct", "update quantity" or skip. */
export default function MenuInventoryCountRunScreen() {
  const { t } = useTranslation("inventory");
  const { countId, lineId } = useLocalSearchParams<{
    countId: string;
    lineId?: string;
  }>();
  const { count, countQuery, answerItem } = useInventoryCount(countId);
  const [currentId, setCurrentId] = useState<string | null>(lineId ?? null);
  const [isEditing, setIsEditing] = useState(false);

  const lines = useMemo(() => count?.items ?? [], [count]);
  // Without an explicit line, start on the first pending one, then the
  // first skipped one.
  const startLine =
    lines.find(isPending) ??
    lines.find((line) => line.status === InventoryCountItemStatus.SKIPPED);
  const activeId = currentId ?? startLine?.id ?? null;
  const currentIndex = lines.findIndex((line) => line.id === activeId);
  const current = currentIndex >= 0 ? lines[currentIndex] : null;
  const doneCount = lines.filter((line) => !isPending(line)).length;

  const openSummary = () =>
    router.replace({
      pathname: "/(profile)/menu-inventory-count-detail",
      params: { countId },
    });

  // A completed count, or one with nothing left to answer, goes to its summary.
  const nothingToCount =
    !!count && (count.status === InventoryCountStatus.COMPLETED || !current);
  useEffect(() => {
    if (nothingToCount) openSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nothingToCount]);

  const goToNext = (updatedLines: InventoryCountItem[]) => {
    // With no pending line left, the id matches nothing and the effect
    // above opens the summary.
    const next = findNextPending(updatedLines, currentIndex);
    setCurrentId(next?.id ?? DONE);
  };

  const answer = (
    answerValue: InventoryCountAnswer,
    countedQuantity?: number,
  ) => {
    if (!current) return;
    answerItem.mutate(
      { itemId: current.id, answer: answerValue, countedQuantity },
      {
        onSuccess: (updated) => {
          setIsEditing(false);
          goToNext(updated.items ?? []);
        },
      },
    );
  };

  const goToPrevious = () => {
    if (currentIndex > 0) setCurrentId(lines[currentIndex - 1].id);
  };

  const goForward = () => {
    if (currentIndex < lines.length - 1)
      setCurrentId(lines[currentIndex + 1].id);
    else openSummary();
  };

  const addProducts = () =>
    router.push({
      pathname: "/(profile)/menu-inventory-count-items",
      params: { countId },
    });

  const pendingAnswer = answerItem.isPending
    ? answerItem.variables?.answer
    : undefined;
  const item = current?.inventoryItem;
  const unit = item ? t(`units.${item.unit}`) : "";
  const answered = current ? isCountItemAnswered(current) : false;

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ThemedView style={tw`px-4 pt-8 gap-4 bg-transparent`}>
        <InventoryScreenHeader
          title={t("counts.runTitle")}
          right={
            <ThemedView style={tw`flex-row gap-1 bg-transparent`}>
              <IconButton icon="add-outline" onPress={addProducts} />
              <IconButton icon="list-outline" onPress={openSummary} />
            </ThemedView>
          }
        />

        {lines.length > 0 && (
          <View style={tw`gap-2`}>
            <ThemedText type="small" style={tw`text-gray-500`}>
              {t("counts.progress", {
                current: currentIndex + 1,
                total: lines.length,
                done: doneCount,
              })}
            </ThemedText>
            <View style={tw`h-2 rounded-full bg-gray-200 overflow-hidden`}>
              <View
                style={[
                  tw`h-2 rounded-full bg-light-primary`,
                  { width: `${(doneCount / lines.length) * 100}%` },
                ]}
              />
            </View>
          </View>
        )}
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 gap-4 pb-8 pt-6 flex-grow`}
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

        {current && item && (
          <>
            <Card style={tw`p-6`}>
              <ThemedView style={tw`gap-3 items-center bg-transparent`}>
                <Ionicons
                  name="cube-outline"
                  size={40}
                  color={tw.color("gray-400")}
                />
                <ThemedText
                  type="h2"
                  style={[{ fontFamily: typography.medium }, tw`text-center`]}
                >
                  {item.name}
                </ThemedText>
                {item.category && (
                  <Label text={item.category.name} size="small" />
                )}
                <ThemedText type="small" style={tw`text-gray-500 mt-2`}>
                  {t("counts.systemSays")}
                </ThemedText>
                <ThemedText type="h1" style={{ fontFamily: typography.medium }}>
                  {t("quantityWithUnit", { quantity: item.quantity, unit })}
                </ThemedText>
                {answered && (
                  <Label
                    text={
                      current.status === InventoryCountItemStatus.MATCHED
                        ? t("counts.status.MATCHED")
                        : t("counts.adjustedBy", {
                            difference: formatDifference(current.difference),
                            unit,
                          })
                    }
                    color={
                      current.status === InventoryCountItemStatus.MATCHED
                        ? "success"
                        : "warning"
                    }
                    size="small"
                  />
                )}
                {current.status === InventoryCountItemStatus.SKIPPED && (
                  <Label text={t("counts.status.SKIPPED")} size="small" />
                )}
              </ThemedView>
            </Card>

            <View style={tw`gap-3`}>
              <Button
                leftIcon="checkmark-outline"
                label={t("counts.correct")}
                loading={pendingAnswer === InventoryCountAnswer.MATCH}
                disabled={answerItem.isPending}
                onPress={() => answer(InventoryCountAnswer.MATCH)}
              />
              <Button
                leftIcon="create-outline"
                label={t("counts.updateQuantity")}
                variant="outline"
                disabled={answerItem.isPending}
                onPress={() => setIsEditing(true)}
              />
            </View>

            <View style={tw`flex-row justify-between mt-auto`}>
              <Button
                leftIcon="chevron-back-outline"
                label={t("counts.previous")}
                variant="text"
                disabled={currentIndex <= 0 || answerItem.isPending}
                onPress={goToPrevious}
              />
              {answered ? (
                <Button
                  rightIcon="chevron-forward-outline"
                  label={t("counts.next")}
                  variant="text"
                  disabled={answerItem.isPending}
                  onPress={goForward}
                />
              ) : (
                <Button
                  rightIcon="play-skip-forward-outline"
                  label={t("counts.skip")}
                  variant="text"
                  loading={pendingAnswer === InventoryCountAnswer.SKIP}
                  disabled={answerItem.isPending}
                  onPress={() => answer(InventoryCountAnswer.SKIP)}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>

      <CountQuantityModal
        item={isEditing && item ? item : null}
        loading={pendingAnswer === InventoryCountAnswer.ADJUST}
        onConfirm={(quantity) => answer(InventoryCountAnswer.ADJUST, quantity)}
        onClose={() => setIsEditing(false)}
      />
    </ScreenLayout>
  );
}

const formatDifference = (difference: number | null) =>
  difference != null && difference > 0
    ? `+${difference}`
    : `${difference ?? 0}`;
