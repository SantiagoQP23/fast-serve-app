import { useState } from "react";
import type { ViewStyle } from "react-native";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import Button from "@/presentation/theme/components/button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { useInventoryCount } from "@/presentation/inventory/hooks/useInventoryCounts";
import {
  InventoryCountItemStatus,
  isCountItemAnswered,
} from "@/core/inventory/models/inventory-count.model";

interface CountFinishButtonProps {
  countId: string;
  style?: ViewStyle;
}

/** Finishes a count, confirming first when some products were never answered. */
export default function CountFinishButton({
  countId,
  style,
}: CountFinishButtonProps) {
  const { t } = useTranslation("inventory");
  const { count, complete } = useInventoryCount(countId);
  const [confirmFinish, setConfirmFinish] = useState(false);

  const lines = count?.items ?? [];
  const unanswered = lines.filter((line) => !isCountItemAnswered(line));
  const hasPending = lines.some(
    (line) => line.status === InventoryCountItemStatus.PENDING,
  );

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
    <>
      <Button
        leftIcon="checkmark-done-outline"
        label={t("counts.finish")}
        variant={hasPending ? "outline" : "primary"}
        loading={complete.isPending && !confirmFinish}
        onPress={handleFinish}
        style={style}
      />
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
    </>
  );
}
