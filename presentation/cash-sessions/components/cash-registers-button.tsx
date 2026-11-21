import { View } from "react-native";
import { useRouter } from "expo-router";

import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import tw from "@/presentation/theme/lib/tailwind";
import Button from "@/presentation/theme/components/button";
import { useCashRegisters, useCashRoles } from "../hooks/useCashSessions";

/**
 * Home header "Caja" button for the registers (owner, admin, cashier). A dot marks
 * an open register; tapping opens the "Cajas" screen (/cash-session/registers).
 */
export default function CashRegistersButton() {
  const { t } = useTranslation(["common"]);
  const router = useRouter();
  const { canRunRegisters } = useCashRoles();
  const { registers } = useCashRegisters(canRunRegisters);

  const anyOpen = registers.some((register) => !!register.session);

  if (!canRunRegisters) return null;

  return (
    <View>
      <Button
        label={t("common:cashRegister.register")}
        leftIcon="banknote"
        variant="surface"
        shape="rounded"
        size="small"
        onPress={() => router.push("/cash-session/registers")}
      />
      {anyOpen && (
        <View
          pointerEvents="none"
          style={tw`absolute top-0 right-0 w-3 h-3 rounded-full bg-primary border-2 border-background`}
        />
      )}
    </View>
  );
}
