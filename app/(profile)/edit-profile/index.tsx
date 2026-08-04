import { KeyboardAvoidingView, ScrollView, Pressable } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { router } from "expo-router";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner-native";
import { GoogleSigninButton } from "@react-native-google-signin/google-signin";

const profileSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function EditProfileScreen() {
  const { t } = useTranslation("auth");
  const { user, updateProfile, loginWithGoogle } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.person?.firstName || "",
      lastName: user?.person?.lastName || "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    const wasSuccessful = await updateProfile(
      data.firstName.trim(),
      data.lastName.trim(),
    );

    if (wasSuccessful) {
      toast.success("Perfil actualizado correctamente");
      router.back();
    } else {
      toast.error("Error al actualizar el perfil");
    }
  };

  const hasGoogleLinked = user?.authProvider?.includes("google");

  const handleLinkGoogle = async () => {
    const wasSuccessful = await loginWithGoogle();

    if (wasSuccessful) {
      toast.success("Cuenta de Google vinculada correctamente");
    } else {
      toast.error("Error al vincular cuenta de Google");
    }
  };

  return (
    <KeyboardAvoidingView style={tw`flex-1`} behavior="padding">
      <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <ThemedView style={tw`items-center gap-2 flex-row`}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => tw.style(pressed && "opacity-70")}
            >
              <Ionicons name="arrow-back-outline" size={24} />
            </Pressable>
            <ThemedText type="h2">Editar perfil</ThemedText>
          </ThemedView>

          <ThemedView style={tw`my-6`} />

          {/* Form */}
          <ThemedView style={tw`gap-4`}>
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Nombre"
                  icon="person-outline"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={
                    errors.firstName ? errors.firstName.message : undefined
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Apellido"
                  icon="person-outline"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={errors.lastName ? errors.lastName.message : undefined}
                />
              )}
            />
          </ThemedView>

          <ThemedView style={tw`my-4`} />

          <Button
            label="Guardar cambios"
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          />

          <ThemedView style={tw`my-6`} />

          {/* Auth Providers */}
          <ThemedView style={tw`gap-3`}>
            <ThemedText type="body2" style={tw`text-gray-500`}>
              Métodos de inicio de sesión
            </ThemedText>

            <ThemedView style={tw`flex-row gap-2`}>
              <ThemedView
                style={tw`rounded-full bg-green-100 px-3 py-1 flex-row items-center gap-1`}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={tw.color("green-600")}
                />
                <ThemedText type="small" style={tw`text-green-700`}>
                  Local
                </ThemedText>
              </ThemedView>

              {hasGoogleLinked ? (
                <ThemedView
                  style={tw`rounded-full bg-blue-100 px-3 py-1 flex-row items-center gap-1`}
                >
                  <Ionicons
                    name="logo-google"
                    size={14}
                    color={tw.color("blue-600")}
                  />
                  <ThemedText type="small" style={tw`text-blue-700`}>
                    Google
                  </ThemedText>
                </ThemedView>
              ) : (
                <ThemedView
                  style={tw`rounded-full bg-gray-100 px-3 py-1 flex-row items-center gap-1`}
                >
                  <Ionicons
                    name="logo-google"
                    size={14}
                    color={tw.color("gray-400")}
                  />
                  <ThemedText type="small" style={tw`text-gray-400`}>
                    Google
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>

            {!hasGoogleLinked && (
              <ThemedView style={tw`items-center mt-2`}>
                <GoogleSigninButton
                  size={GoogleSigninButton.Size.Wide}
                  color={GoogleSigninButton.Color.Dark}
                  onPress={handleLinkGoogle}
                />
              </ThemedView>
            )}
          </ThemedView>
        </ScrollView>
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}
