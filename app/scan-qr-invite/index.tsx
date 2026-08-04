import { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { toast } from "sonner-native";
import { Ionicons } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";

import tw from "@/presentation/theme/lib/tailwind";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { RestaurantService } from "@/core/restaurant/services/restaurant.service";

import Button from "@/presentation/theme/components/button";
import Select from "@/presentation/theme/components/select";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";

const ROLES = [
  { label: "Administrador", value: 1 },
  { label: "Mesero", value: 2 },
  { label: "Cocinero", value: 3 },
];

export default function ScanQrInviteScreen() {
  const { currentRestaurant } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedToken, setScannedToken] = useState<string>("");
  const [userInfo, setUserInfo] = useState<{
    userId: string;
    name: string;
    email: string;
  } | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(2);
  const [isValidating, setIsValidating] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      if (scannedToken || isValidating) return;

      const data = result.data;
      let token = "";

      // Try to extract token from URL query param
      if (data.includes("?token=")) {
        token = data.split("?token=")[1]?.split("&")[0] || "";
      } else {
        token = data;
      }

      if (!token) {
        toast.error("Codigo QR invalido");
        return;
      }

      setScannedToken(token);
      setIsValidating(true);

      try {
        const response = await RestaurantService.validateQrToken(token);
        setUserInfo(response);
      } catch {
        toast.error("Codigo QR expirado o invalido");
        setScannedToken("");
      } finally {
        setIsValidating(false);
      }
    },
    [scannedToken, isValidating],
  );

  const handleAccept = async () => {
    if (!scannedToken || !currentRestaurant) return;
    setIsAccepting(true);
    try {
      await RestaurantService.acceptQrInvite({
        token: scannedToken,
        roleId: selectedRoleId,
      });
      toast.success("Usuario agregado exitosamente");
      router.back();
    } catch {
      toast.error("Error al agregar el usuario");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReset = () => {
    setScannedToken("");
    setUserInfo(null);
    setSelectedRoleId(2);
  };

  if (!permission?.granted) {
    return (
      <ScreenLayout style={tw`flex-1 px-6`}>
        <ThemedView style={tw`flex-1 justify-center items-center gap-4`}>
          <Ionicons name="camera-outline" size={64} color={tw.color("gray-400")} />
          <ThemedText type="h2" style={tw`text-center`}>
            Permiso de camara
          </ThemedText>
          <ThemedText type="body2" style={tw`text-center text-gray-600`}>
            Necesitamos acceso a la camara para escanear el codigo QR.
          </ThemedText>
          <Button label="Conceder permiso" onPress={requestPermission} />
          <Button label="Volver" onPress={() => router.back()} variant="text" />
        </ThemedView>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ThemedView style={tw`flex-1`}>
        {!userInfo ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={handleBarCodeScanned}
            />
            <ThemedView
              style={tw`absolute top-0 left-0 right-0 p-6 pt-12 bg-black/50`}
            >
              <ThemedText type="h2" style={tw`text-white text-center`}>
                Escanear codigo QR
              </ThemedText>
              <ThemedText type="body2" style={tw`text-gray-300 text-center`}>
                Apunta la camara al codigo QR del usuario
              </ThemedText>
            </ThemedView>

            <ThemedView
              style={tw`absolute bottom-0 left-0 right-0 p-6 pb-12 bg-black/50 items-center`}
            >
              <Pressable
                onPress={() => router.back()}
                style={tw`bg-white/20 rounded-full px-6 py-3`}
              >
                <ThemedText style={tw`text-white font-semibold`}>
                  Cancelar
                </ThemedText>
              </Pressable>
            </ThemedView>

            {isValidating && (
              <ThemedView
                style={tw`absolute inset-0 bg-black/70 items-center justify-center`}
              >
                <ActivityIndicator size="large" color="#fff" />
                <ThemedText type="body2" style={tw`text-white mt-4`}>
                  Validando codigo...
                </ThemedText>
              </ThemedView>
            )}
          </>
        ) : (
          <ThemedView style={tw`flex-1 px-6 justify-center gap-6`}>
            <ThemedView style={tw`items-center gap-2`}>
              <Ionicons
                name="person-circle-outline"
                size={80}
                color={tw.color("light-primary")}
              />
              <ThemedText type="h2" style={tw`text-center`}>
                {userInfo.name}
              </ThemedText>
              <ThemedText type="body2" style={tw`text-center text-gray-600`}>
                {userInfo.email}
              </ThemedText>
            </ThemedView>

            <ThemedView style={tw`w-full gap-4`}>
              <Select
                label="Seleccionar rol"
                options={ROLES}
                value={selectedRoleId}
                onChange={setSelectedRoleId}
                placeholder="Selecciona un rol"
              />
            </ThemedView>

            <ThemedView style={tw`w-full gap-3`}>
              <Button
                label="Agregar al restaurante"
                onPress={handleAccept}
                loading={isAccepting}
                disabled={isAccepting}
              />
              <Button
                label="Escanear otro codigo"
                onPress={handleReset}
                variant="secondary"
              />
            </ThemedView>
          </ThemedView>
        )}
      </ThemedView>
    </ScreenLayout>
  );
}
