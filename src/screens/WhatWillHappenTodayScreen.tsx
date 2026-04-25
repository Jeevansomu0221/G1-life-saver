import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Screen } from "@/components/Screen";
import { SectionCard } from "@/components/SectionCard";
import { aiService } from "@/services/aiService";
import { colors } from "@/theme/colors";

const TODAY_PREDICTION_STORAGE_KEY = "krsna-ai-today-prediction";

type StoredTodayPrediction = {
  dateKey: string;
  prediction: string;
};

type PredictionSection = {
  key: string;
  title: string;
  body: string;
};

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatTodayDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function buildFallbackPrediction(dateLabel: string) {
  return `Your "Today" Prediction
Date: ${dateLabel}

Morning: You'll start with a mix of routine and mild distraction. One small message, thought, or task may slightly shift your plan.
Midday: Expect a moment where you need to make a quick decision. It will not be huge, but it may affect how productive or relaxed the rest of your day feels.
Afternoon: Energy could dip a bit. If you push through one useful task, you will feel better later.
Evening: A conversation or interaction may stand out more than usual, possibly something that makes you think or smile.
Night: You may reflect on something unfinished and quietly decide what you want to improve tomorrow.

Wildcard Possibility
There is a decent chance of something unplanned but minor happening, like a change in schedule, a surprise message, or a small opportunity.`;
}

function parsePrediction(prediction: string, todayLabel: string): PredictionSection[] {
  const normalized = prediction.replace(/\r/g, "").trim();
  const sectionPatterns = [
    { title: "Morning", pattern: /Morning:\s*([\s\S]*?)(?=\n(?:Midday|Afternoon|Evening|Night|Wildcard Possibility):|\nWildcard Possibility|\s*$)/i },
    { title: "Midday", pattern: /Midday:\s*([\s\S]*?)(?=\n(?:Afternoon|Evening|Night|Wildcard Possibility):|\nWildcard Possibility|\s*$)/i },
    { title: "Afternoon", pattern: /Afternoon:\s*([\s\S]*?)(?=\n(?:Evening|Night|Wildcard Possibility):|\nWildcard Possibility|\s*$)/i },
    { title: "Evening", pattern: /Evening:\s*([\s\S]*?)(?=\n(?:Night|Wildcard Possibility):|\nWildcard Possibility|\s*$)/i },
    { title: "Night", pattern: /Night:\s*([\s\S]*?)(?=\nWildcard Possibility:|\nWildcard Possibility|\s*$)/i },
    { title: "Wildcard Possibility", pattern: /Wildcard Possibility:?\s*([\s\S]*?)$/i }
  ];

  const extracted = sectionPatterns
    .map(({ title, pattern }) => {
      const match = normalized.match(pattern);
      return match?.[1]?.trim() ? { key: title, title, body: match[1].trim() } : null;
    })
    .filter(Boolean) as PredictionSection[];

  if (extracted.length > 0) {
    return extracted;
  }

  return [
    {
      key: "today",
      title: "Today",
      body: normalized.replace(/^Your "Today" Prediction\s*/i, "").replace(new RegExp(`Date:\\s*${todayLabel}\\s*`, "i"), "").trim()
    }
  ];
}

export function WhatWillHappenTodayScreen() {
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => formatDateKey(today), [today]);
  const todayLabel = useMemo(() => formatTodayDate(today), [today]);
  const fallbackPrediction = useMemo(() => buildFallbackPrediction(todayLabel), [todayLabel]);
  const [prediction, setPrediction] = useState(fallbackPrediction);
  const predictionSections = useMemo(() => parsePrediction(prediction, todayLabel), [prediction, todayLabel]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>();

  const loadPrediction = async () => {
    setLoading(true);
    setLoadError(undefined);

    try {
      const storedRaw = await AsyncStorage.getItem(TODAY_PREDICTION_STORAGE_KEY);
      const stored = storedRaw ? (JSON.parse(storedRaw) as StoredTodayPrediction) : null;
      if (stored?.dateKey === todayKey && stored.prediction) {
        setPrediction(stored.prediction);
        return;
      }

      const result = await aiService.getTodayPrediction(todayLabel);
      const nextPrediction = result.trim();
      setPrediction(nextPrediction);
      await AsyncStorage.setItem(
        TODAY_PREDICTION_STORAGE_KEY,
        JSON.stringify({
          dateKey: todayKey,
          prediction: nextPrediction
        })
      );
    } catch (error) {
      setPrediction(fallbackPrediction);
      setLoadError(error instanceof Error ? error.message : "AI prediction could not be loaded right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrediction();
  }, []);

  return (
    <Screen>
      <View style={styles.datePill}>
        <Text style={styles.datePillText}>{todayLabel}</Text>
      </View>

      <SectionCard title="Your Today Reading">
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.gold} size="small" />
            <Text style={styles.body}>Generating today's prediction...</Text>
          </View>
        ) : null}

        {!loading ? (
          <View style={styles.sectionStack}>
            {predictionSections.map((section) => (
              <View key={section.key} style={styles.readingBlock}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.predictionText}>{section.body}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {loadError ? <Text style={styles.errorText}>Showing offline example. {loadError}</Text> : null}
      </SectionCard>

      <SectionCard title="Note">
        <Text style={styles.body}>
          This does not mean events will happen exactly as written. Treat this as insight, reflection, and a way to enter the day with greater awareness.
        </Text>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  datePill: {
    alignSelf: "flex-start",
    marginTop: 8,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(216,177,90,0.28)",
    backgroundColor: "rgba(216,177,90,0.08)"
  },
  datePillText: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: "700"
  },
  body: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  },
  sectionStack: {
    gap: 10
  },
  readingBlock: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card
  },
  sectionTitle: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 6
  },
  predictionText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 20
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10
  },
  errorText: {
    color: "#FFB4B4",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 10
  }
});
