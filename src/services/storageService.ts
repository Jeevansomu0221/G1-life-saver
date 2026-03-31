import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppStorageShape } from "@/types/domain";

const STORAGE_KEY = "g1-life-saver-storage";

const emptyState: AppStorageShape = {
  tasks: [],
  chatHistory: [],
  settings: {
    hasCompletedOnboarding: false
  }
};

export const storageService = {
  async load(): Promise<AppStorageShape> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyState;
    }

    try {
      return { ...emptyState, ...JSON.parse(raw) };
    } catch {
      return emptyState;
    }
  },

  async save(data: AppStorageShape) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
};
