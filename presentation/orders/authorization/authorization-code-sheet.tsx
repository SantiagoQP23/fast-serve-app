import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import NumberPad from "@/presentation/theme/components/number-pad";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import {
  AUTHORIZATION_CODE_LENGTH,
  isAuthorizationError,
} from "@/core/orders/authorization/authorization-code.model";
import { useAuthorizationCodeStore } from "./useAuthorizationCodeStore";

/**
 * Asks for an owner/admin code before removing units from an order. Sends
 * the action itself, so a wrong code shows its error here and the digits
 * stay for fixing one.
 */
export function AuthorizationCodeSheet() {
  const { t } = useTranslation(["orders", "errors"]);
  const sheetRef = useRef<BottomSheetMethods>(null);
  const request = useAuthorizationCodeStore((state) => state.request);
  const close = useAuthorizationCodeStore((state) => state.close);
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (request) {
      // Lets a closing dialog or sheet finish before this one opens.
      const timer = setTimeout(() => sheetRef.current?.present(), 250);
      return () => clearTimeout(timer);
    }
    sheetRef.current?.dismiss();
  }, [request]);

  const onChange = (value: string) => {
    setDigits(value);
    setError(null);
  };

  const onConfirm = async () => {
    if (!request || digits.length !== AUTHORIZATION_CODE_LENGTH) return;
    setSending(true);
    const result = await request.submit(digits);
    setSending(false);

    if (result.ok) {
      close();
      return;
    }

    if (isAuthorizationError(result.code)) {
      setError(result.msg ?? t("errors:general.somethingWrong"));
      return;
    }

    // Any other error was already shown by the action itself.
    close();
  };

  const boxes = Array.from({ length: AUTHORIZATION_CODE_LENGTH }, (_, i) => (
    <View
      key={i}
      style={tw.style(
        "w-11 h-14 rounded-md border items-center justify-center",
        i === digits.length && !error ? "border-primary" : "border-border",
        !!error && "border-red-500",
      )}
    >
      <ThemedText style={{ fontFamily: typography.bold, fontSize: 26 }}>
        {digits[i] ?? ""}
      </ThemedText>
    </View>
  ));

  return (
    <ThemedBottomSheetModal
      ref={sheetRef}
      enablePanDownToClose={!sending}
      onDismiss={() => {
        // Starts blank next time.
        setDigits("");
        setError(null);
        setSending(false);
        if (useAuthorizationCodeStore.getState().request) close();
      }}
    >
      <BottomSheetView style={tw`px-4 pb-6 pt-2`}>
        <ThemedText type="h3" style={tw`text-center`}>
          {t("orders:authorization.sheetTitle")}
        </ThemedText>
        {!!request?.summary && (
          <ThemedText type="body2" style={tw`text-center text-gray-500 mt-1`}>
            {request.summary}
          </ThemedText>
        )}
        <View
          style={tw`flex-row justify-center gap-2 mt-4 mb-2`}
          accessibilityLabel={t("orders:authorization.codeLabel")}
        >
          {boxes}
        </View>
        <ThemedText
          type="small"
          style={tw.style(
            "text-center mb-3 min-h-5",
            error ? "text-red-500" : "text-gray-500",
          )}
        >
          {error ?? t("orders:authorization.sheetHint")}
        </ThemedText>
        <NumberPad
          value={digits}
          onChange={onChange}
          maxLength={AUTHORIZATION_CODE_LENGTH}
          onConfirm={onConfirm}
          confirmLabel={t("orders:authorization.confirm")}
          confirmDisabled={digits.length !== AUTHORIZATION_CODE_LENGTH}
          confirmLoading={sending}
          disabled={sending}
        />
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
}
