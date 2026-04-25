import React from "react";
import { StyleSheet, Text } from "react-native";
import { Screen } from "@/components/Screen";
import { SectionCard } from "@/components/SectionCard";
import { colors } from "@/theme/colors";

export function PrivacyScreen() {
  return (
    <Screen>
      <Text style={styles.title}>Privacy &amp; AI Policy</Text>
      <Text style={styles.subtitle}>How Krsna AI handles app data, AI responses, and user responsibility.</Text>

      <SectionCard title="Information stored on your device" subtitle="Local app data">
        <Text style={styles.body}>
          Tasks, completion state, alarm settings, Bhagvadgita daily reading progress, today prediction cache, and Krsna AI chat history are stored locally on your device.
        </Text>
      </SectionCard>

      <SectionCard title="Information sent to our AI service" subtitle="AI requests">
        <Text style={styles.body}>
          When you use Krsna AI or generate an AI-based daily prediction, the text needed to process your request is sent to our configured AI backend. AI provider keys should remain only on the backend.
        </Text>
      </SectionCard>

      <SectionCard title="How AI responses are used" subtitle="Gemini-backed guidance">
        <Text style={styles.body}>
          Krsna AI uses Gemini-backed responses to provide spiritual guidance and reflective predictions. AI output may be incomplete or imperfect and should be used as guidance, not as guaranteed fact or outcome.
        </Text>
      </SectionCard>

      <SectionCard title="No sensitive professional advice" subtitle="Important limitation">
        <Text style={styles.body}>
          Krsna AI is not a medical, legal, financial, emergency, or crisis support service. Do not rely on the app for urgent help, diagnosis, legal decisions, or financial decisions.
        </Text>
      </SectionCard>

      <SectionCard title="Contact and updates" subtitle="Policy maintenance">
        <Text style={styles.body}>
          This policy may be updated from time to time as the app changes. For privacy or policy questions, contact the app publisher through the support details provided with the app listing.
        </Text>
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
