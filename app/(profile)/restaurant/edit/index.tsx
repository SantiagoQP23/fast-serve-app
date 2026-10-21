import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { router } from "expo-router";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";

import tw from "@/presentation/theme/lib/tailwind";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import { RestaurantService } from "@/core/restaurant/services/restaurant.service";
import { UpdateRestaurantDto } from "@/core/restaurant/dto/update-restaurant.dto";
import { getErrorMessage } from "@/core/api/get-error-message";

import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";

type EditRestaurantFormData = {
  name: string;
  phone: string;
  email: string;
  address: string;
  identification: string;
  capacity: string;
};

export default function EditRestaurantScreen() {
  const { t } = useTranslation("auth");
  const { user, currentRestaurant, updateCurrentRestaurantInfo } =
    useAuthStore();
  const canEdit = isAdminLevelRole(user?.role?.name);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateRestaurantDto) =>
      RestaurantService.update(currentRestaurant!.id, data),
  });

  const schema = z.object({
    name: z
      .string()
      .trim()
      .min(1, t("createRestaurant.validations.nameRequired"))
      .max(100, t("editRestaurant.validations.nameTooLong")),
    phone: z.string(),
    email: z
      .string()
      .trim()
      .refine(
        (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        t("createRestaurant.validations.invalidEmail"),
      ),
    address: z
      .string()
      .max(200, t("editRestaurant.validations.addressTooLong")),
    identification: z.string(),
    capacity: z
      .string()
      .trim()
      .refine(
        (val) => !val || /^\d+$/.test(val),
        t("editRestaurant.validations.invalidCapacity"),
      ),
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<EditRestaurantFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: currentRestaurant?.name ?? "",
      phone: currentRestaurant?.phone ?? "",
      email: currentRestaurant?.email ?? "",
      address: currentRestaurant?.address ?? "",
      identification: currentRestaurant?.identification ?? "",
      capacity:
        currentRestaurant?.capacity != null
          ? String(currentRestaurant.capacity)
          : "",
    },
  });

  const onSubmit = async (data: EditRestaurantFormData) => {
    const capacity = data.capacity.trim();
    const payload: UpdateRestaurantDto = {
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      address: data.address.trim(),
      identification: data.identification.trim(),
      capacity: capacity ? Number(capacity) : null,
    };

    try {
      await updateMutation.mutateAsync(payload);
      // No success toast: the info screen already shows the new info.
      updateCurrentRestaurantInfo({
        ...payload,
        capacity: payload.capacity ?? undefined,
      });
      router.back();
    } catch (error) {
      toast.error(
        getErrorMessage(error, { fallback: t("editRestaurant.errorMessage") }),
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1`}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScreenLayout style={tw`flex-1 px-4 pt-4`}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`gap-4 pb-8`}
          keyboardShouldPersistTaps="handled"
        >
          {!canEdit && (
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("editRestaurant.readOnly")}
            </ThemedText>
          )}

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label={t("createRestaurant.name")}
                icon="store"
                autoCapitalize="words"
                maxLength={100}
                editable={canEdit}
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label={t("createRestaurant.phone")}
                placeholder={t("createRestaurant.phonePlaceholder")}
                icon="phone"
                keyboardType="phone-pad"
                editable={canEdit}
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={errors.phone?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label={t("createRestaurant.email")}
                placeholder={t("createRestaurant.emailPlaceholder")}
                icon="mail"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={canEdit}
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label={t("createRestaurant.address")}
                placeholder={t("createRestaurant.addressPlaceholder")}
                icon="map-pin"
                maxLength={200}
                editable={canEdit}
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={errors.address?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="identification"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label={t("editRestaurant.identification")}
                icon="id-card"
                editable={canEdit}
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={errors.identification?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="capacity"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label={t("editRestaurant.capacity")}
                icon="users"
                keyboardType="number-pad"
                editable={canEdit}
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={errors.capacity?.message}
              />
            )}
          />

          {canEdit && (
            <ThemedView style={tw`mt-4`}>
              <Button
                label={t("editRestaurant.save")}
                onPress={handleSubmit(onSubmit)}
                disabled={!isDirty || updateMutation.isPending}
                loading={updateMutation.isPending}
              />
            </ThemedView>
          )}
        </ScrollView>
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}
