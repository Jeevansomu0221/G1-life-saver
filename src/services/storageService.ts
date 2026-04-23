import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppStorageShape } from "@/types/domain";

const STORAGE_KEY = "krsna-ai-storage";

const emptyState: AppStorageShape = {
  tasks: [],
  chatHistory: [],
  settings: {
    hasCompletedOnboarding: false,
    aiPlan: "free",
    aiUsage: {
      date: new Date().toISOString().slice(0, 10),
      messagesUsed: 0
    },
    gitaDaily: {
      streakCount: 0,
      totalReadSlokas: 0
    }
  }
};

export const storageService = {
  async load(): Promise<AppStorageShape> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyState;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<AppStorageShape>;
      return {
        ...emptyState,
        ...parsed,
        settings: {
          ...emptyState.settings,
          ...parsed.settings,
          aiUsage: {
            ...emptyState.settings.aiUsage,
            ...(parsed.settings?.aiUsage ?? {})
          },
          gitaDaily: {
            ...emptyState.settings.gitaDaily,
            ...(parsed.settings?.gitaDaily ?? {})
          }
        }
      };
    } catch {
      return emptyState;
    }
  },

  async save(data: AppStorageShape) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
};
