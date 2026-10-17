import { useContext, useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { RestaurantService } from "@/core/restaurant/services/restaurant.service";
import { useTablesStore } from "@/presentation/tables/hooks/useTablesStore";
import {
  NO_AREA_KEY,
  useCreateBranchStore,
} from "@/presentation/restaurant/store/useCreateBranchStore";
import { SocketContext } from "@/presentation/shared/context/SocketContext";

import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Paso 1 de "Crear sucursal": datos de la sucursal. El nombre llega
 * prellenado con el siguiente de la secuencia ("La Esquina 2").
 */
export default function CreateBranchDetailsScreen() {
  const { t } = useTranslation("auth");
  const { currentRestaurant } = useAuthStore();
  const { online } = useContext(SocketContext);
  const tables = useTablesStore((state) => state.tables);
  const areas = useTablesStore((state) => state.areas);
  const { sourceRestaurantId, details, start, setDetails } =
    useCreateBranchStore();

  const restaurantId = currentRestaurant?.id;

  const nextNameQuery = useQuery({
    queryKey: ["branches", "next-name", restaurantId],
    queryFn: () => RestaurantService.getNextBranchName(restaurantId!),
    enabled: !!restaurantId,
  });

  // Empieza un borrador nuevo si es otro restaurante; si no, conserva lo
  // ingresado al volver a esta pantalla.
  useEffect(() => {
    if (!currentRestaurant || sourceRestaurantId === currentRestaurant.id)
      return;

    // Mesas prellenadas con lo que hay hoy en cada zona.
    const counts: Record<string, number> = { [NO_AREA_KEY]: 0 };
    const areaIds = new Set(areas.map((area) => area.id));
    areas.forEach((area) => (counts[area.id] = 0));
    tables.forEach((table) => {
      const key =
        table.areaId && areaIds.has(table.areaId) ? table.areaId : NO_AREA_KEY;
      counts[key] += 1;
    });

    start(
      currentRestaurant.id,
      {
        name: "",
        address: currentRestaurant.address ?? "",
        phone: currentRestaurant.phone ?? "",
        email: currentRestaurant.email ?? "",
      },
      counts,
    );
  }, [currentRestaurant, sourceRestaurantId, areas, tables, start]);

  useEffect(() => {
    const suggested = nextNameQuery.data?.name;
    const draft = useCreateBranchStore.getState().details;
    if (suggested && !draft.name) setDetails({ ...draft, name: suggested });
  }, [nextNameQuery.data, setDetails]);

  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const update = (field: keyof typeof details) => (value: string) =>
    setDetails({ ...useCreateBranchStore.getState().details, [field]: value });

  const handleNext = () => {
    const nextErrors: typeof errors = {};
    if (!details.name.trim())
      nextErrors.name = t("createRestaurant.validations.nameRequired");
    if (details.email && !EMAIL_REGEX.test(details.email))
      nextErrors.email = t("createRestaurant.validations.invalidEmail");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    router.push("/(profile)/restaurant/create-branch/tables");
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1`}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenLayout style={tw`flex-1 px-4`}>
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`gap-6 pt-2 pb-8`}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={tw`gap-2`}>
            <ThemedText type="small" style={tw`text-gray-500`}>
              {t("createBranch.steps", { step: 1 })}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-gray-600`}>
              {t("createBranch.details.subtitle", {
                name: currentRestaurant?.name,
              })}
            </ThemedText>
            <ThemedText type="small" style={tw`text-gray-500`}>
              {t("createBranch.details.printersNote")}
            </ThemedText>
          </ThemedView>

          <ThemedView style={tw`gap-4`}>
            <TextInput
              label={t("createRestaurant.name")}
              placeholder={nextNameQuery.data?.name}
              icon="business-outline"
              autoCapitalize="words"
              value={details.name}
              onChangeText={update("name")}
              error={errors.name}
            />
            <TextInput
              label={t("createRestaurant.address")}
              placeholder={t("createRestaurant.addressPlaceholder")}
              icon="location-outline"
              value={details.address}
              onChangeText={update("address")}
            />
            <TextInput
              label={t("createRestaurant.phone")}
              placeholder={t("createRestaurant.phonePlaceholder")}
              icon="call-outline"
              keyboardType="phone-pad"
              value={details.phone}
              onChangeText={update("phone")}
            />
            <TextInput
              label={t("createRestaurant.email")}
              placeholder={t("createRestaurant.emailPlaceholder")}
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              value={details.email}
              onChangeText={update("email")}
              error={errors.email}
            />
          </ThemedView>
        </ScrollView>

        <ThemedView style={tw`gap-2 mb-8`}>
          {!online && (
            <ThemedText type="small" style={tw`text-gray-500 text-center`}>
              {t("createBranch.offline")}
            </ThemedText>
          )}
          <Button
            label={t("createBranch.next")}
            onPress={handleNext}
            disabled={!online}
          />
        </ThemedView>
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}
