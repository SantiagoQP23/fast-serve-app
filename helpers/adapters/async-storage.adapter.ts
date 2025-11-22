import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

export class AsyncStorageAdapter {
  static async setItem(key: string, value: string) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      Alert.alert("Error", "Failed to save data");
    }
  }

  static async getItem(key: string) {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      Alert.alert("Error", "Failed to get data");
      return null;
    }
  }

  static async removeItem(key: string) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to delete data");
    }
  }
}
