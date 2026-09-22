import { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useBills } from "@/presentation/orders/hooks/useBills";
import { usePrinters } from "@/core/printers/hooks/usePrinters";
import { usePrintBillReceipt } from "@/presentation/orders/hooks/usePrintBillReceipt";
import { formatCurrency } from "@/core/i18n/utils";
import { BillSource } from "@/core/orders/models/bill.model";
import Button from "@/presentation/theme/components/button";
import Select from "@/presentation/theme/components/select";
import Card from "@/presentation/theme/components/card";

export default function BillPrintScreen() {
  const { t } = useTranslation(["common", "bills", "orders"]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const billId = Number(id);

  const { data: bill } = useBills().billByIdQuery(billId);

  const { getAll } = usePrinters();
  const { data: printers } = getAll;
  const { printBillReceipt } = usePrintBillReceipt(bill);

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

  if (!bill) {
    return (
      <ScreenLayout style={tw`flex-1 justify-center items-center`}>
        <ThemedText>{t("bills:list.noBills")}</ThemedText>
      </ScreenLayout>
    );
  }

  const handlePrint = async () => {
    const printer = activePrinters.find((p) => p.id === selectedPrinterId);
    if (!printer) return;

    setIsPrinting(true);
    try {
      await printBillReceipt(printer);
      router.back();
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ThemedView style={tw`flex-1 px-4 pt-6 gap-4`}>
        <ThemedText type="h3">{t("bills:print.title")}</ThemedText>

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
                {t("bills:list.title")} #{bill.num}
              </ThemedText>
              <ThemedText style={{ fontFamily: "monospace" }}>
                {new Date(bill.createdAt).toLocaleString()}
              </ThemedText>
            </ThemedView>

            {bill.order && (
              <ThemedView
                style={tw`gap-1 py-3 border-b border-dashed border-light-border`}
              >
                <ThemedText style={{ fontFamily: "monospace" }}>
                  {t("orders:details.orderNumber", { num: bill.order.num })}
                </ThemedText>
                <ThemedText style={{ fontFamily: "monospace" }}>
                  {bill.order.table
                    ? `${t("common:labels.table")}: ${bill.order.table.name}`
                    : t("common:labels.takeAway")}
                </ThemedText>
              </ThemedView>
            )}

            <ThemedView
              style={tw`gap-2 py-3 border-b border-dashed border-light-border`}
            >
              {bill.details.map((detail) => {
                const productName =
                  bill.source === BillSource.ORDER && detail.orderDetail
                    ? detail.orderDetail.product.name
                    : detail.product?.name || "";
                const optionName =
                  detail.productOption?.name ||
                  detail.orderDetail?.productOption?.name;

                return (
                  <ThemedView
                    key={detail.id}
                    style={tw`flex-row justify-between items-start gap-2`}
                  >
                    <ThemedText style={{ fontFamily: "monospace", flex: 1 }}>
                      {detail.quantity}x {productName}
                      {optionName ? ` (${optionName})` : ""}
                    </ThemedText>
                    <ThemedText style={{ fontFamily: "monospace" }}>
                      {formatCurrency(detail.total)}
                    </ThemedText>
                  </ThemedView>
                );
              })}
            </ThemedView>

            <ThemedView
              style={tw`gap-1 py-3 border-b border-dashed border-light-border`}
            >
              <ThemedView style={tw`flex-row justify-between`}>
                <ThemedText style={{ fontFamily: "monospace" }}>
                  {t("bills:details.subtotal")}
                </ThemedText>
                <ThemedText style={{ fontFamily: "monospace" }}>
                  {formatCurrency(bill.subtotal)}
                </ThemedText>
              </ThemedView>
              {bill.discount > 0 && (
                <ThemedView style={tw`flex-row justify-between`}>
                  <ThemedText style={{ fontFamily: "monospace" }}>
                    {t("bills:details.discount")}
                  </ThemedText>
                  <ThemedText style={{ fontFamily: "monospace" }}>
                    -{formatCurrency(bill.discount)}
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>

            <ThemedView style={tw`flex-row justify-between pt-3`}>
              <ThemedText type="h4" style={{ fontFamily: "monospace" }}>
                {t("bills:details.total")}
              </ThemedText>
              <ThemedText type="h4" style={{ fontFamily: "monospace" }}>
                {formatCurrency(bill.total)}
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
            label={t("bills:print.printButton")}
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
