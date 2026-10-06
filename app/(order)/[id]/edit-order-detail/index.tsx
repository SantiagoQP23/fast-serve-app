import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useNavigation } from "expo-router";
import TextInput from "@/presentation/theme/components/text-input";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";
import Label from "@/presentation/theme/components/label";
import { useCounter } from "@/presentation/shared/hooks/useCounter";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useOrders } from "@/presentation/orders/hooks/useOrders";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import {
  ProductOption,
  getProductOptionAvailableQuantity,
} from "@/core/menu/models/product-optionl.model";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import BottomSheetPicker, {
  BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";
import { useOrderDetailStatus } from "@/presentation/orders/hooks/useOrderDetailStatus";
import { OrderDetailStatus } from "@/core/orders/models/order-detail.model";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { KeyboardAvoidingView, ScrollView } from "react-native";
import OrderDetailActivityBottomSheet from "@/presentation/orders/components/order-detail-activity-bottom-sheet";
import dayjs from "dayjs";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import NoteBottomSheet from "@/presentation/orders/components/note-bottom-sheet";
import Card from "@/presentation/theme/components/card";
import Chip from "@/presentation/theme/components/chip";
import Slider from "@/presentation/theme/components/slider";
import OrderDetailStatusModal from "@/presentation/orders/components/order-detail-status-modal";

export default function EditOrderDetailScreen() {
  const { t } = useTranslation(["common", "orders", "menu", "inventory"]);
  const bottomSheetModalRef = useRef<BottomSheetMethods>(null);
  const noteSheetRef = useRef<BottomSheetMethods>(null);
  const activitySheetRef = useRef<BottomSheetMethods>(null);
  const typePickerRef = useRef<BottomSheetPickerRef>(null);
  const orderDetail = useOrdersStore((state) => state.activeOrderDetail);
  const order = useOrdersStore((state) => state.activeOrder);
  const product = useMenuStore((state) =>
    state.products.find((p) => p.id === orderDetail?.product.id),
  );

  const { counter, increment, decrement } = useCounter(
    orderDetail?.quantity,
    1,
    20,
    orderDetail?.qtyDelivered || 1,
  );

  const [statusModalVisible, setStatusModalVisible] = useState(false);

  const {
    counter: qtyDelivered,
    increment: incrementDelivered,
    decrement: decrementDelivered,
    setCounter: setQtyDelivered,
  } = useCounter(orderDetail?.qtyDelivered, 1, orderDetail?.quantity, 0);

  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const isAdmin = isAdminLevelRole(user?.role?.name);
  const {
    isOnline,
    isLoading,
    mutate: updateOrderDetail,
  } = useOrders().updateOrderDetail;

  const [notes, setNotes] = useState(orderDetail?.description || "");
  const [selectedOption, setSelectedOption] = useState<ProductOption | null>(
    orderDetail?.productOption ??
      product?.options.find((option) => option.isDefault) ??
      null,
  );
  const [price, setPrice] = useState(
    String(orderDetail?.price ?? selectedOption?.price ?? ""),
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    orderDetail?.tags?.map((t) => t.id) ?? [],
  );

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const setActiveOrderDetail = useOrdersStore(
    (state) => state.setActiveOrderDetail,
  );

  const { statusText, statusIcon, labelColor } = useOrderDetailStatus(
    orderDetail?.status || OrderDetailStatus.PENDING,
  );

  const openCustomBottomSheet = () => {
    bottomSheetModalRef.current?.present();
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        isAdmin ? (
          <IconButton icon="create-outline" onPress={openCustomBottomSheet} />
        ) : null,
    });
  }, [navigation, openCustomBottomSheet, isAdmin]);

  const closeCustomBottomSheet = () => {
    bottomSheetModalRef.current?.dismiss();
  };

  const openNoteBottomSheet = () => {
    noteSheetRef.current?.present();
  };

  const closeNoteBottomSheet = () => {
    noteSheetRef.current?.dismiss();
  };

  const saveNote = (note: string) => {
    setNotes(note);
    closeNoteBottomSheet();
  };

  if (!orderDetail || !product) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText type="h2">{t("orders:details.noActiveOrder")}</ThemedText>
      </ThemedView>
    );
  }

  const createdAtLabel = dayjs(orderDetail.createdAt).format("HH:mm");

  const parsedPrice = parseFloat(price);
  const effectivePrice = Number.isFinite(parsedPrice)
    ? parsedPrice
    : (selectedOption?.price ?? orderDetail.price);

  const onChangeSelectedOption = (option: ProductOption) => {
    setSelectedOption(option);
    setPrice(String(option.price));
  };

  const onUpdateOrderDetail = () => {
    updateOrderDetail(
      {
        id: orderDetail.id,
        quantity: counter,
        qtyDelivered,
        description: notes,
        price: effectivePrice,
        orderId: order!.id,
        tagIds: selectedTagIds,
        productOptionId: selectedOption?.id,
      },
      {
        onSuccess: () => {
          setActiveOrderDetail(null);
          router.back();
        },
      },
    );
  };

  const openActivityBottomSheet = () => {
    activitySheetRef.current?.present();
  };

  const openStatusModal = () => {
    setStatusModalVisible(true);
  };

  const closeStatusModal = () => {
    setStatusModalVisible(false);
  };

  const onSelectStatus = (status: OrderDetailStatus) => {
    const newQtyDelivered =
      status === OrderDetailStatus.DELIVERED ? orderDetail.quantity : 0;

    updateOrderDetail(
      {
        id: orderDetail.id,
        orderId: order!.id,
        status,
        qtyDelivered: newQtyDelivered,
      },
      {
        onSuccess: () => {
          setQtyDelivered(newQtyDelivered);
          setActiveOrderDetail({
            ...orderDetail,
            status,
            qtyDelivered: newQtyDelivered,
          });
          closeStatusModal();
        },
      },
    );
  };

  return (
    <>
      <KeyboardAvoidingView style={tw`flex-1`} behavior="padding">
        <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
          <ThemedView style={tw`flex-1`} />
          <ThemedView style={tw` text-center mb-4 gap-4`}>
            <ThemedView style={tw`flex-row items-center gap-2 flex-wrap my-2 `}>
              <Label
                text={statusText}
                color={labelColor}
                leftIcon={statusIcon}
                onPress={openStatusModal}
                size="small"
              />
              <Label
                leftIcon="notifications-outline"
                text={String(orderDetail.readyQuantity)}
                size="small"
              />
              {/* <Label */}
              {/*   leftIcon="time-outline" */}
              {/*   text={createdAtLabel} */}
              {/*   onPress={openActivityBottomSheet} */}
              {/* /> */}
            </ThemedView>

            <ThemedView style={tw`gap-2`}>
              <ThemedView
                style={tw`flex-row items-center justify-between gap-2`}
              >
                <ThemedText type="h2">{product.name}</ThemedText>
                <ThemedText>
                  {formatCurrency(counter * effectivePrice)}
                </ThemedText>
              </ThemedView>
              {product.description && (
                <ThemedText type="body1" style={tw`text-gray-600`}>
                  {product.description}
                </ThemedText>
              )}
            </ThemedView>
            {orderDetail.quantity > 1 && (
              <ThemedView style={tw`gap-1`}>
                <ThemedView style={tw`flex-row items-center justify-between`}>
                  <ThemedText type="body2" style={tw`text-gray-500`}>
                    {t("common:status.delivered")}
                  </ThemedText>
                  <ThemedText type="body2" style={tw`text-gray-500`}>
                    {qtyDelivered} / {orderDetail.quantity}
                  </ThemedText>
                </ThemedView>
                <Slider
                  value={qtyDelivered}
                  minimumValue={0}
                  maximumValue={orderDetail.quantity}
                  step={1}
                  height={12}
                  onValueChange={setQtyDelivered}
                  onSlidingComplete={setQtyDelivered}
                />
              </ThemedView>
            )}

            <ThemedView>
              {/* <ThemedText style={tw`text-gray-500 mb-2`}> */}
              {/*   {t("menu:variants")} */}
              {/* </ThemedText> */}
              {product.options.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={tw`gap-3`}
                >
                  {product.options.map((option) => {
                    const isSelected = selectedOption?.id === option.id;
                    return (
                      <ThemedView key={option.id}>
                        <Card
                          onPress={() => onChangeSelectedOption(option)}
                          variant="outline"
                          style={tw`min-w-36 gap-2 p-4 rounded-3xl border-2 ${isSelected ? "border-light-primary bg-transparent" : "border-transparent"}`}
                        >
                          <ThemedView
                            style={tw`flex-row items-center justify-between gap-2`}
                          >
                            <ThemedText type="body1" style={tw``}>
                              {option.name}
                            </ThemedText>
                            {option.inventoryItems?.length ? (
                              <ThemedView
                                style={tw`flex-row items-center gap-1 bg-transparent`}
                              >
                                <Ionicons
                                  name="cube-outline"
                                  size={14}
                                  color={tw.color("text-gray-500")}
                                />
                                <ThemedText
                                  type="small"
                                  style={tw`text-gray-500`}
                                >
                                  {t("inventory:stockCount", {
                                    count:
                                      getProductOptionAvailableQuantity(
                                        option,
                                      ) ?? 0,
                                  })}
                                </ThemedText>
                              </ThemedView>
                            ) : null}
                          </ThemedView>
                          <ThemedText type="body2" style={tw``}>
                            {formatCurrency(option.price)}
                          </ThemedText>
                        </Card>
                      </ThemedView>
                    );
                  })}
                </ScrollView>
              )}
            </ThemedView>
            {product.tags?.filter((tag) => tag.isActive && !tag.isArchived)
              .length > 0 && (
              <ThemedView style={tw`flex-row flex-wrap gap-2 `}>
                {product.tags
                  .filter((tag) => tag.isActive && !tag.isArchived)
                  .map((tag) => (
                    <Label
                      key={tag.id}
                      text={tag.name}
                      color={
                        selectedTagIds.includes(tag.id) ? "default" : "outline"
                      }
                      onPress={() => toggleTag(tag.id)}
                    />
                  ))}
              </ThemedView>
            )}
          </ThemedView>

          <ThemedView style={tw`gap-8`}>
            {/* <ThemedView style={tw`flex-row justify-between items-center`}> */}
            {/*   <ThemedText type="h4">{t("common:status.delivered")}</ThemedText> */}
            {/*   <ThemedView style={tw`flex-row items-center gap-4`}> */}
            {/*     <IconButton */}
            {/*       icon="remove-outline" */}
            {/*       onPress={decrementDelivered} */}
            {/*       variant="outlined" */}
            {/*     /> */}
            {/*     <ThemedText>{qtyDelivered}</ThemedText> */}
            {/*     <IconButton */}
            {/*       icon="add" */}
            {/*       onPress={incrementDelivered} */}
            {/*       variant="outlined" */}
            {/*     /> */}
            {/*   </ThemedView> */}
            {/* </ThemedView> */}
            {notes.trim() && (
              <TextInput
                numberOfLines={4}
                multiline
                value={notes}
                onChangeText={setNotes}
                editable={false}
                placeholder={t("orders:newOrder.addNote")}
                pointerEvents="none"
              />
            )}

            <ThemedView style={tw`flex-row  justify-center gap-4 w-full `}>
              <ThemedView style={tw`flex-row items-center gap-6`}>
                <IconButton
                  icon="remove-outline"
                  onPress={decrement}
                  variant="secondary"
                  size={50}
                />
                <ThemedText type="h1">{counter}</ThemedText>
                <IconButton
                  icon="add"
                  onPress={increment}
                  variant="secondary"
                  size={50}
                />
              </ThemedView>
            </ThemedView>
            <ThemedView style={tw`flex-row items-center gap-2 `}>
              <Chip
                label={
                  orderDetail.typeOrderDetail === OrderType.IN_PLACE
                    ? t("common:orderType.inPlace")
                    : t("common:orderType.takeAway")
                }
                icon={
                  orderDetail.typeOrderDetail === OrderType.IN_PLACE
                    ? "restaurant-outline"
                    : "bag-outline"
                }
                variant="filter"
                onPress={() => typePickerRef.current?.present()}
              />

              {!notes.trim() && (
                <Chip
                  variant="assist"
                  label={t("orders:newOrder.addNote")}
                  icon="document-text-outline"
                  onPress={openNoteBottomSheet}
                />
              )}
            </ThemedView>

            <ThemedView style={tw`flex-row gap-5  mb-4`}>
              {/* <Button */}
              {/*   label={t("menu:product.customize")} */}
              {/*   variant="text" */}
              {/*   onPress={openCustomBottomSheet} */}
              {/* /> */}
              <Button
                label={t("orders:edit.saveChanges")}
                onPress={onUpdateOrderDetail}
                leftIcon="save-outline"
                style={tw`flex-1`}
              />
            </ThemedView>
          </ThemedView>
        </ScreenLayout>

        <ThemedBottomSheetModal ref={bottomSheetModalRef} enablePanDownToClose>
          <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
            <TextInput
              label={t("orders:newOrder.customPrice")}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              bottomSheet
            />

            <Button
              label={t("menu:product.saveDetails")}
              onPress={closeCustomBottomSheet}
            />
          </BottomSheetView>
        </ThemedBottomSheetModal>

        <NoteBottomSheet
          ref={noteSheetRef}
          initialValue={notes}
          onSave={saveNote}
          placeholder={t("orders:newOrder.addNote")}
        />

        <OrderDetailStatusModal
          visible={statusModalVisible}
          detail={orderDetail}
          onSelectStatus={onSelectStatus}
          onClose={closeStatusModal}
        />

        <OrderDetailActivityBottomSheet
          detail={orderDetail}
          bottomSheetRef={activitySheetRef}
        />

        <BottomSheetPicker
          ref={typePickerRef}
          title={t("orders:newOrder.orderType")}
          options={[
            { label: t("common:orderType.inPlace"), value: OrderType.IN_PLACE },
            {
              label: t("common:orderType.takeAway"),
              value: OrderType.TAKE_AWAY,
            },
          ]}
          value={orderDetail.typeOrderDetail}
          onChange={(value) => {
            updateOrderDetail(
              {
                id: orderDetail.id,
                orderId: order!.id,
                typeOrderDetail: value as OrderType,
              },
              {
                onSuccess: () => {},
              },
            );
          }}
        />
      </KeyboardAvoidingView>
    </>
  );
}
