import { useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
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
import { useWebsocketEventListener } from "@/presentation/shared/hooks/useWebsocketEventListener";
import { OrderSocketEvent } from "@/core/orders/enums/socket-events.enum";

import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";

const createRestaurantSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  phone: z.string().optional(),
  email: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      "Ingresa un email valido.",
    ),
  address: z.string().optional(),
  tablesQuantity: z
    .number({ message: "La cantidad de mesas es obligatoria." })
    .min(1, "Minimo 1 mesa.")
    .max(50, "Maximo 50 mesas."),
});

type CreateRestaurantFormData = z.infer<typeof createRestaurantSchema>;

export default function NoRestaurantScreen() {
  const { t } = useTranslation("auth");
  const { logout, changeStatus, checkStatus } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useWebsocketEventListener(OrderSocketEvent.restaurantAssigned, async () => {
    toast.success("¡Fuiste agregado al restaurante exitosamente!");
    await checkStatus();
    router.replace("/(app)/(tabs)/(orders-module)/my-orders");
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
        toast.success("Restaurante creado exitosamente");
        router.replace("/(app)/(tabs)/(orders-module)/my-orders");
      } else {
        toast.error("Error al crear el restaurante");
      }
    } catch {
      toast.error("Error al crear el restaurante");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1`}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenLayout style={tw`flex-1 px-6`}>
        <ScrollView
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
              Datos del restaurante
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-600`}>
              Completa la informacion para continuar con la configuracion.
            </ThemedText>
          </ThemedView>

          <ThemedView style={tw`w-full gap-4`}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Nombre"
                  placeholder="Restaurante Central"
                  autoCapitalize="words"
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
                  label="Telefono"
                  placeholder="+593 99 123 4567"
                  keyboardType="phone-pad"
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
                  label="Email"
                  placeholder="restaurante@example.com"
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
                  label="Direccion"
                  placeholder="Av. Principal 123"
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
                  label="Cantidad de mesas"
                  placeholder="4"
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

          <ThemedView style={tw`w-full gap-3`}>
            <Button
              label="Guardar y continuar"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting}
            />
            <Button
              label="Unirse a un restaurante"
              onPress={() => router.push("/join-restaurant")}
              variant="secondary"
            />
          </ThemedView>
        </ScrollView>

        <ThemedView style={tw`mb-8 w-full`}>
          <Button
            variant="text"
            label={t("manage.logout")}
            onPress={handleLogout}
          />
        </ThemedView>
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}
