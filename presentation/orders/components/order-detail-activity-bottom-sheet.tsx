import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useCallback } from "react";
import { OrderDetail } from "@/core/orders/models/order-detail.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";

dayjs.extend(relativeTime);

interface OrderDetailActivityBottomSheetProps {
  detail: OrderDetail;
  bottomSheetRef: React.RefObject<BottomSheetModal>;
}

export default function OrderDetailActivityBottomSheet({
  detail,
  bottomSheetRef,
}: OrderDetailActivityBottomSheetProps) {
  const { t } = useTranslation(["orders"]);
  const createdAt = dayjs(detail.createdAt);
  const updatedAt = dayjs(detail.updatedAt);
  const createdAtLabel = `${createdAt.fromNow()} · ${createdAt.format(
    "MMM D, HH:mm",
  )}`;
  const updatedAtLabel = `${updatedAt.fromNow()} · ${updatedAt.format(
    "MMM D, HH:mm",
  )}`;
  const createdByName = detail.createdBy
    ? `${detail.createdBy.person.firstName} ${detail.createdBy.person.lastName}`
    : null;
  const updatedByName = detail.updatedBy
    ? `${detail.updatedBy.person.firstName} ${detail.updatedBy.person.lastName}`
    : null;

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={["30%"]}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
    >
      <BottomSheetView style={tw`px-4 pb-6`}>
        <ThemedView style={tw`mb-4`}>
          <ThemedText type="h3">{t("orders:details.activity")}</ThemedText>
          <ThemedText type="body2" style={tw`text-gray-500 mt-1`}>
            {detail.product.name}
          </ThemedText>
        </ThemedView>
        <ThemedView style={tw`gap-3`}>
          <ThemedView style={tw`gap-1`}>
            <ThemedView style={tw`flex-row items-center gap-2`}>
              <Ionicons
                name="ellipse-outline"
                size={12}
                color={tw.color("gray-500")}
              />
              <ThemedText type="body2" style={tw`text-gray-600`}>
                {t("orders:details.createdAt")}
              </ThemedText>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {createdAtLabel}
              </ThemedText>
            </ThemedView>
            {createdByName && (
              <ThemedText type="small" style={tw`text-gray-500 ml-5`}>
                {t("orders:detailInfo.createdBy", {
                  name: createdByName,
                })}
              </ThemedText>
            )}
          </ThemedView>
          <ThemedView style={tw`gap-1`}>
            <ThemedView style={tw`flex-row items-center gap-2`}>
              <Ionicons
                name="ellipse-outline"
                size={12}
                color={tw.color("gray-500")}
              />
              <ThemedText type="body2" style={tw`text-gray-600`}>
                {t("orders:details.updatedAt")}
              </ThemedText>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {updatedAtLabel}
              </ThemedText>
            </ThemedView>
            {updatedByName && (
              <ThemedText type="small" style={tw`text-gray-500 ml-5`}>
                {t("orders:detailInfo.updatedBy", {
                  name: updatedByName,
                })}
              </ThemedText>
            )}
          </ThemedView>
        </ThemedView>
      </BottomSheetView>
    </BottomSheetModal>
  );
}
