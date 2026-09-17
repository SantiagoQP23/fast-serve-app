import { useState } from "react";
import { KeyboardAvoidingView, ScrollView, Platform } from "react-native";
import { router } from "expo-router";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner-native";
import { Ionicons } from "@expo/vector-icons";

import tw from "@/presentation/theme/lib/tailwind";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { RestaurantService } from "@/core/restaurant/services/restaurant.service";

import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";

type CreateRestaurantFormData = {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  tablesQuantity: number;
};

export default function CreateRestaurantScreen() {
  const { t } = useTranslation("auth");
  const { changeStatus } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createRestaurantSchema = z.object({
    name: z.string().min(1, t("createRestaurant.validations.nameRequired")),
    phone: z.string().optional(),
    email: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        t("createRestaurant.validations.invalidEmail"),
      ),
    address: z.string().optional(),
    tablesQuantity: z
      .number({
        message: t("createRestaurant.validations.tablesQuantityRequired"),
      })
      .min(1, t("createRestaurant.validations.tablesQuantityMin"))
      .max(50, t("createRestaurant.validations.tablesQuantityMax")),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRestaurantFormData>({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      tablesQuantity: 4,
    },
  });

  const onSubmit = async (data: CreateRestaurantFormData) => {
    setIsSubmitting(true);
    try {
      const response = await RestaurantService.create(data);

      if (response?.token && response?.user) {
        await changeStatus(
          response.token,
          response.user,
          response.currentRestaurant ?? undefined,
        );

        if (useAuthStore.getState().bootstrapStatus === "error") {
          toast.error(t("validations.bootstrapError"));
          return;
        }

        toast.success(t("createRestaurant.successMessage"));
        router.replace("/(app)/(tabs)/(orders-module)/my-orders");
      } else {
        toast.error(t("createRestaurant.errorMessage"));
      }
    } catch {
      toast.error(t("createRestaurant.errorMessage"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1`}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenLayout style={tw`flex-1 px-4`}>
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`flex-grow justify-center gap-6`}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedView style={tw`items-center gap-2`}>
            <Ionicons
              name="business-outline"
              size={64}
              color={tw.color("light-primary")}
            />
            <ThemedText type="h2" style={tw`text-center`}>
              {t("createRestaurant.title")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-600`}>
              {t("createRestaurant.subtitle")}
            </ThemedText>
          </ThemedView>

          <ThemedView style={tw`w-full gap-4`}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("createRestaurant.name")}
                  placeholder={t("createRestaurant.namePlaceholder")}
                  icon="business-outline"
                  autoCapitalize="words"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={errors.name?.message}
                />
              )}
            />

            {/* <Controller */}
            {/*   control={control} */}
            {/*   name="phone" */}
            {/*   render={({ field: { onChange, onBlur, value } }) => ( */}
            {/*     <TextInput */}
            {/*       label={t("createRestaurant.phone")} */}
            {/*       placeholder={t("createRestaurant.phonePlaceholder")} */}
            {/*       icon="call-outline" */}
            {/*       keyboardType="phone-pad" */}
            {/*       onBlur={onBlur} */}
            {/*       value={value} */}
            {/*       onChangeText={onChange} */}
            {/*       error={errors.phone?.message} */}
            {/*     /> */}
            {/*   )} */}
            {/* /> */}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("createRestaurant.email")}
                  placeholder={t("createRestaurant.emailPlaceholder")}
                  icon="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
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
                  icon="location-outline"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={errors.address?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="tablesQuantity"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label={t("createRestaurant.tablesQuantity")}
                  placeholder={t("createRestaurant.tablesQuantityPlaceholder")}
                  icon="grid-outline"
                  keyboardType="number-pad"
                  onBlur={onBlur}
                  value={value?.toString()}
                  onChangeText={(text) => {
                    const parsed = parseInt(text, 10);
                    onChange(isNaN(parsed) ? "" : parsed);
                  }}
                  error={errors.tablesQuantity?.message}
                />
              )}
            />
          </ThemedView>
        </ScrollView>

        <ThemedView
          style={tw`w-full gap-3 flex-row items-center justify-between mb-8`}
        >
          <Button
            label={t("createRestaurant.backButton")}
            onPress={() => router.back()}
            variant="text"
          />
          <Button
            label={t("createRestaurant.submitButton")}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </ThemedView>
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}
