import { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { router } from "expo-router";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { usePrinters } from "@/core/printers/hooks/usePrinters";
import { usePrintOrderReceipt } from "@/presentation/orders/hooks/usePrintOrderReceipt";
import { formatCurrency } from "@/core/i18n/utils";
import { getUserDisplayName } from "@/core/auth/utils/get-user-display-name";
import { OrderDetailStatus } from "@/core/orders/models/order-detail.model";
import Button from "@/presentation/theme/components/button";
import Select from "@/presentation/theme/components/select";
import Card from "@/presentation/theme/components/card";

export default function OrderPrintScreen() {
  const { t } = useTranslation(["common", "orders"]);
  const order = useOrdersStore((state) => state.activeOrder);

  const { getAll } = usePrinters();
  const { data: printers } = getAll;
  const { printOrderReceipt } = usePrintOrderReceipt();

  const [selectedPrinterId, setSelectedPrinterId] = useState<string>();
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    getAll.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activePrinters = (printers ?? []).filter((p) => p.isActive);

  useEffect(() => {
    if (!selectedPrinterId && activePrinters.length > 0) {
      setSelectedPrinterId(activePrinters[0].id);
    }
  }, [activePrinters, selectedPrinterId]);

  if (!order) {
    return (
      <ScreenLayout style={tw`flex-1 justify-center items-center`}>
        <ThemedText type="h2">{t("orders:details.noActiveOrder")}</ThemedText>
      </ScreenLayout>
    );
  }

  const handlePrint = async () => {
    const printer = activePrinters.find((p) => p.id === selectedPrinterId);
    if (!printer || !order) return;

    setIsPrinting(true);
    try {
      await printOrderReceipt(printer, order);
      router.back();
    } finally {
      setIsPrinting(false);
    }
  };

  const visibleDetails = order.details.filter(
    (detail) => detail.status !== OrderDetailStatus.CANCELLED,
  );

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ThemedView style={tw`flex-1 px-4 pt-6 gap-4`}>
        <ThemedText type="h3">{t("orders:print.title")}</ThemedText>

        <ScrollView
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`pb-4`}
        >
          <Card style={tw``}>
            <ThemedView
              style={tw`items-center gap-1 pb-3 border-b border-dashed border-light-border`}
            >
              <ThemedText type="h4" style={{ fontFamily: "monospace" }}>
                {t("orders:details.orderNumber", { num: order.num })}
              </ThemedText>
              <ThemedText style={{ fontFamily: "monospace" }}>
                {order.table
                  ? `${t("common:labels.table")}: ${order.table.name}`
                  : t("common:labels.takeAway")}
              </ThemedText>
            </ThemedView>

            <ThemedView
              style={tw`gap-1 py-3 border-b border-dashed border-light-border`}
            >
              <ThemedText style={{ fontFamily: "monospace" }}>
                {t("common:labels.waiter")}:{" "}
                {getUserDisplayName(order.user, t("common:labels.deletedUser"))}
              </ThemedText>
              <ThemedText style={{ fontFamily: "monospace" }}>
                {t("common:labels.date")}:{" "}
                {new Date(order.createdAt).toLocaleString()}
              </ThemedText>
              <ThemedText style={{ fontFamily: "monospace" }}>
                {t("common:labels.people")}: {order.people}
              </ThemedText>
              {order.notes && (
                <ThemedText style={{ fontFamily: "monospace" }}>
                  {t("common:labels.notes")}: {order.notes}
                </ThemedText>
              )}
            </ThemedView>

            <ThemedView
              style={tw`gap-2 py-3 border-b border-dashed border-light-border`}
            >
              {visibleDetails.map((detail) => (
                <ThemedView
                  key={detail.id}
                  style={tw`flex-row justify-between items-start gap-2`}
                >
                  <ThemedText style={{ fontFamily: "monospace", flex: 1 }}>
                    {detail.quantity}x {detail.product.name}
                    {detail.product.options.length > 1 && detail.productOption
                      ? ` ${detail.productOption.name}`
                      : ""}
                  </ThemedText>
                  <ThemedText style={{ fontFamily: "monospace" }}>
                    {formatCurrency(detail.quantity * detail.price)}
                  </ThemedText>
                </ThemedView>
              ))}
            </ThemedView>

            <ThemedView style={tw`flex-row justify-between pt-3`}>
              <ThemedText type="h4" style={{ fontFamily: "monospace" }}>
                {t("common:labels.total")}
              </ThemedText>
              <ThemedText type="h4" style={{ fontFamily: "monospace" }}>
                {formatCurrency(order.total)}
              </ThemedText>
            </ThemedView>
          </Card>
        </ScrollView>

        <ThemedView style={tw`gap-3 pb-4`}>
          {activePrinters.length === 0 ? (
            <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
              {t("orders:options.noPrintersMessage")}
            </ThemedText>
          ) : (
            <Select
              label={t("orders:options.selectPrinter")}
              options={activePrinters.map((p) => ({
                label: p.name,
                value: p.id,
              }))}
              value={selectedPrinterId}
              onChange={(value) => setSelectedPrinterId(String(value))}
            />
          )}

          <Button
            label={t("orders:print.printButton")}
            leftIcon="print-outline"
            onPress={handlePrint}
            loading={isPrinting}
            disabled={isPrinting || !selectedPrinterId}
          />
        </ThemedView>
      </ThemedView>
    </ScreenLayout>
  );
}
