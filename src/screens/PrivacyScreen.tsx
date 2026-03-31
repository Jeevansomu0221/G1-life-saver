import React from "react";
import { StyleSheet, Text } from "react-native";
import { Screen } from "@/components/Screen";
import { SectionCard } from "@/components/SectionCard";
import { colors } from "@/theme/colors";

export function PrivacyScreen() {
  return (
    <Screen>
      <Text style={styles.title}>Privacy &amp; AI Policy</Text>
      <Text style={styles.subtitle}>Use this as the in-app policy draft before publishing the Play Store listing.</Text>

      <SectionCard title="What stays on device" subtitle="Current local storage behavior">
        <Text style={styles.body}>Tasks, alarm settings, completion state, and Krsna chat history are stored on your device with AsyncStorage.</Text>
      </SectionCard>

      <SectionCard title="What leaves the device" subtitle="AI requests">
        <Text style={styles.body}>
          When Krsna AI is used, the active chat messages needed for the reply are sent to your configured AI backend. For release builds, keep provider keys only on the backend.
        </Text>
      </SectionCard>

      <SectionCard title="Recommended before launch" subtitle="Production checklist">
        <Text style={styles.body}>Rotate all exposed API keys, host the AI backend securely, publish a real privacy policy URL, and review notification permission wording for Android 13 and newer.</Text>
      </SectionCard>

      <SectionCard title="User expectation" subtitle="Plain-language disclosure">
        <Text style={styles.body}>Krsna AI is a spiritual guidance experience, not medical, legal, or crisis care. Add a full policy page on your website before public release.</Text>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800"
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 10
  },
  body: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  }
});
