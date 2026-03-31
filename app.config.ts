import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Krsna AI",
  slug: "krsna-ai",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "krsnaai",
  userInterfaceStyle: "dark",
  assetBundlePatterns: ["**/*"],
  plugins: ["expo-notifications"],
  icon: "./assets/krsna-ai-icon.png",
  android: {
    package: "com.krsnaai.app",
    adaptiveIcon: {
      foregroundImage: "./assets/krsna-ai-icon.png",
      backgroundColor: "#060B16"
    },
    permissions: ["VIBRATE"]
  },
  extra: {
    eas: {
      projectId: "b1f61d46-454c-4e09-8640-94d3696a7dfb"
    },
    aiProxyUrl: process.env.EXPO_PUBLIC_AI_PROXY_URL ?? "",
    aiModel: process.env.EXPO_PUBLIC_AI_MODEL ?? "gemini-2.5-flash-lite",
    geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "",
    openAIApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? ""
  }
};

export default config;
