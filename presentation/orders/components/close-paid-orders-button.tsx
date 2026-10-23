import { useState } from "react";
import { useRouter } from "expo-router";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useClosePaidOrders } from "../hooks/useClosePaidOrders";

/**
 * Closes every open order that is paid and delivered. Users confirm closing
 * their own in a dialog; owners and admins, when other users also have
 * orders to close, pick their own or everyone's on the close paid orders
 * screen.
 */
export default function ClosePaidOrdersButton() {
  const { t } = useTranslation(["common", "orders"]);
  const router = useRouter();
  const isAdmin = useAuthStore((state) =>
    isAdminLevelRole(state.user?.role?.name),
  );
  const { allCount, mineCount, closePaidOrders, isLoading } =
    useClosePaidOrders();
  const [dialogVisible, setDialogVisible] = useState(false);

  const count = isAdmin ? allCount : mineCount;
  if (count === 0) return null;

  // Only a choice to make when other users have orders to close too
  const canChooseScope = isAdmin && allCount > mineCount;

  return (
    <ThemedView style={tw`items-center px-4 pt-2 pb-4`}>
      <Button
        variant="text"
        size="small"
        leftIcon="lock"
        label={t("orders:closePaid.button", { count })}
        onPress={() =>
          canChooseScope
            ? router.push("/(order)/close-paid-orders")
            : setDialogVisible(true)
        }
      />
      {!canChooseScope && (
        <DialogModal
          visible={dialogVisible}
          title={t("orders:closePaid.title")}
          message={t("orders:closePaid.message", { count })}
          confirmLabel={t("common:actions.close")}
          onConfirm={() =>
            closePaidOrders("mine", () => setDialogVisible(false))
          }
          onCancel={() => setDialogVisible(false)}
          loading={isLoading}
        />
      )}
    </ThemedView>
  );
}
