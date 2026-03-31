import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { useAppData } from "@/state/AppDataContext";
import { colors } from "@/theme/colors";
import { RootStackParamList } from "@/types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

export function WelcomeScreen({ navigation }: Props) {
  const { completeOnboarding } = useAppData();

  const enterApp = async () => {
    await completeOnboarding();
    navigation.replace("MainTabs");
  };

  return (
    <Screen>
      <LinearGradient colors={["#14315F", "#0B1630", "#060B16"]} style={styles.hero}>
        <Text style={styles.kicker}>Welcome</Text>
        <Text style={styles.title}>Krsna AI</Text>
        <Text style={styles.subtitle}>Tasks, reminders, and Krsna&apos;s guidance in one calm space.</Text>
      </LinearGradient>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Before you begin</Text>
        <Text style={styles.blockBody}>Allow notifications so reminders and task alarms can help you at the right time.</Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>What is saved</Text>
        <Text style={styles.blockBody}>Your tasks, reminders, and chat history stay on this device so the app feels personal from the start.</Text>
      </View>

      <PrimaryButton label="Enter the App" onPress={enterApp} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(216,177,90,0.22)",
    padding: 18,
    marginBottom: 14
  },
  kicker: {
    color: colors.gold,
    textTransform: "uppercase",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
    marginTop: 6
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8
  },
  block: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10
  },
  blockTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  blockBody: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6
  }
});
