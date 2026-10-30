import { typography } from "@/constants/theme";
import { Stack, useRouter } from "expo-router";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { usePalette } from "@/presentation/theme/store/useThemeStore";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import Button from "@/presentation/theme/components/button";

export default function BillsLayout() {
  const palette = usePalette();
  const { t } = useTranslation(["bills", "common"]);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const canEditPaymentMethods = isAdminLevelRole(user?.role?.name);
  const selectedPaymentMethodId = useOrdersStore(
    (state) => state.selectedPaymentMethod?.id,
  );

  const renderEditButton = (onPress: () => void) =>
    canEditPaymentMethods ? (
      <Button
        label={t("common:actions.edit")}
        variant="surface"
        size="extra-small"
        onPress={onPress}
      />
    ) : null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.text,
        headerTitleStyle: { fontFamily: typography.medium },
      }}
    >
      <Stack.Screen
        name="[id]/index"
        options={{
          headerShown: true,
          title: "",
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="[id]/edit/index"
        options={{
          headerShown: true,
          title: "",
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="[id]/edit-sale/index"
        options={{
          headerShown: true,
          title: "",
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="[id]/print/index"
        options={{
          headerShown: true,
          title: "",
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="[id]/payment-method/index"
        options={{
          headerShown: true,
          title: t("bills:details.paymentMethod"),
          headerShadowVisible: false,
          headerRight: () =>
            renderEditButton(() => router.push("/(profile)/payment-methods")),
        }}
      />
      <Stack.Screen
        name="[id]/payment-method/account/index"
        options={{
          headerShown: true,
          title: t("bills:account.selectAccountTitle"),
          headerShadowVisible: false,
          // Accounts are linked on the payment method's detail screen.
          headerRight: () =>
            selectedPaymentMethodId !== undefined &&
            renderEditButton(() =>
              router.push({
                pathname: "/(profile)/payment-methods/details",
                params: { methodId: String(selectedPaymentMethodId) },
              }),
            ),
        }}
      />
    </Stack>
  );
}
