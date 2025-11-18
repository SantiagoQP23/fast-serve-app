import { KeyboardAvoidingView } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useState } from "react";
import { useRouter } from "expo-router";
import Switch from "@/presentation/theme/components/switch";
import TextInput from "@/presentation/theme/components/text-input";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";
import { useCounter } from "@/presentation/shared/hooks/useCounter";

export default function RestaurantMenuScreen() {
  const [section, setSection] = useState("");
  const { counter, increment, decrement } = useCounter(1, 1, 20, 1);
  const router = useRouter();
  const [selected, setSelected] = useState("All");
  const [withNotes, setWithNotes] = useState(true);

  const goToMenu = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView style={tw`flex-1`} behavior="padding">
      <ThemedView style={tw`px-4 pt-8 flex-1 gap-4`}>
        <ThemedView style={tw`flex-row justify-between mb-4 items-center`}>
          <ThemedView>
            <ThemedText type="h2">Arroz marinero</ThemedText>
            <ThemedText type="body1">$12</ThemedText>
          </ThemedView>
          <ThemedView style={tw`flex-row items-center gap-2`}>
            <IconButton
              icon="remove-outline"
              onPress={decrement}
              variant="outlined"
            />
            <ThemedText>{counter}</ThemedText>
            <IconButton icon="add" onPress={increment} variant="outlined" />
          </ThemedView>
        </ThemedView>
        <ThemedText type="body2">
          lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod
        </ThemedText>

        <ThemedView style={tw`flex-row justify-between mb-4 items-center`}>
          <ThemedView>
            <ThemedText type="h4">Entregado</ThemedText>
          </ThemedView>
          <ThemedView style={tw`flex-row items-center gap-4`}>
            <IconButton
              icon="remove-outline"
              onPress={decrement}
              variant="outlined"
            />
            <ThemedText>{counter}</ThemedText>
            <IconButton icon="add" onPress={increment} variant="outlined" />
          </ThemedView>
        </ThemedView>
        <TextInput
          label="Price"
          keyboardType="numeric"
          icon="pricetag-outline"
        />
        <ThemedView>
          <Switch
            label="Add note"
            value={withNotes}
            onValueChange={setWithNotes}
          />
          {withNotes && <TextInput numberOfLines={5} multiline />}
        </ThemedView>
        <ThemedView style={tw`flex-1 `} />
        <ThemedView style={tw`w-full `}>
          <Button
            label="Save changes"
            onPress={goToMenu}
            leftIcon="save-outline"
          />
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}
