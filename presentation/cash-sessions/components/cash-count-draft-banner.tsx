import { useState } from "react";
import dayjs from "dayjs";

import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import DialogModal from "@/presentation/theme/components/dialog-modal";

interface CashCountDraftBannerProps {
  savedAt: string;
  /** Left out for a locked count, which can't be started over. */
  onStartOver?: () => void;
}

/** "Count saved at 2:32 PM · Start over", above a resumed count. */
export default function CashCountDraftBanner({
  savedAt,
  onStartOver,
}: CashCountDraftBannerProps) {
  const { t } = useTranslation(["common"]);
  const [confirm, setConfirm] = useState(false);

  return (
    <ThemedView
      style={tw`flex-row items-center justify-between gap-2 rounded-md border border-divider bg-surface-container-low px-3 py-1.5 min-h-10`}
    >
      <ThemedText type="small" style={tw`flex-1 text-on-surface-variant`}>
        {t("common:cashRegister.draft.savedAt", {
          time: dayjs(savedAt).format("HH:mm"),
        })}
      </ThemedText>
      {onStartOver && (
        <>
          <Button
            label={t("common:cashRegister.draft.startOver")}
            variant="text"
            size="small"
            onPress={() => setConfirm(true)}
          />
          <DialogModal
            visible={confirm}
            title={t("common:cashRegister.draft.startOverTitle")}
            message={t("common:cashRegister.draft.startOverMessage")}
            confirmLabel={t("common:cashRegister.draft.startOver")}
            onConfirm={() => {
              setConfirm(false);
              onStartOver();
            }}
            onCancel={() => setConfirm(false)}
          />
        </>
      )}
    </ThemedView>
  );
}
