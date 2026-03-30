import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "G1 - Life Saver",
  slug: "g1-life-saver",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "g1lifesaver",
  userInterfaceStyle: "dark",
  assetBundlePatterns: ["**/*"],
  plugins: ["expo-notifications"],
  android: {
    package: "com.g1lifesaver.app",
    permissions: ["VIBRATE"]
  },
  extra: {
    aiProxyUrl: process.env.EXPO_PUBLIC_AI_PROXY_URL ?? "",
    aiModel: process.env.EXPO_PUBLIC_AI_MODEL ?? "gemini-2.5-flash-lite",
    geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "",
    openAIApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? ""
  }
};

export default config;
