import React, { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { LabeledInput } from "@/components/LabeledInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { SectionCard } from "@/components/SectionCard";
import { SegmentedControl } from "@/components/SegmentedControl";
import { colors } from "@/theme/colors";
import {
  FocusArea,
  PredictionInput,
  ZodiacName,
  detectZodiacFromDob,
  generatePredictionReport,
  zodiacOptions
} from "@/utils/astrology";

const focusOptions: { label: string; value: FocusArea }[] = [
  { label: "Money", value: "Money" },
  { label: "Career", value: "Career" },
  { label: "Love", value: "Love" },
  { label: "Health", value: "Health" }
];

export function PredictMyFutureScreen() {
  const [mode, setMode] = useState<"dob" | "zodiac">("dob");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [timeOfBirth, setTimeOfBirth] = useState("");
  const [selectedZodiac, setSelectedZodiac] = useState(zodiacOptions[0]);
  const [mainFocus, setMainFocus] = useState<FocusArea>("Career");
  const [submittedInput, setSubmittedInput] = useState<PredictionInput | null>(null);

  const detectedZodiac = useMemo(() => (dateOfBirth ? detectZodiacFromDob(dateOfBirth) : null), [dateOfBirth]);
  const report = useMemo(() => (submittedInput ? generatePredictionReport(submittedInput) : null), [submittedInput]);

  const buildReport = () => {
    setSubmittedInput({
      dateOfBirth: mode === "dob" ? dateOfBirth : undefined,
      placeOfBirth: mode === "dob" ? placeOfBirth : undefined,
      timeOfBirth: mode === "dob" ? timeOfBirth : undefined,
      zodiacSign: mode === "zodiac" ? selectedZodiac : undefined,
      mainFocus
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <Screen>
        <SectionCard title="Your Inputs">
          <Text style={styles.label}>Input Mode</Text>
          <SegmentedControl
            value={mode}
            options={[
              { label: "DOB", value: "dob" },
              { label: "Zodiac", value: "zodiac" }
            ]}
            onChange={setMode}
          />

          {mode === "dob" ? (
            <>
              <LabeledInput label="Date of Birth" value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="YYYY-MM-DD" />
              <LabeledInput label="Place of Birth (Optional)" value={placeOfBirth} onChangeText={setPlaceOfBirth} placeholder="City, State" />
              <LabeledInput label="Time of Birth (Optional)" value={timeOfBirth} onChangeText={setTimeOfBirth} placeholder="HH:MM AM/PM" />
              {detectedZodiac ? <Text style={styles.detectedText}>Detected Zodiac: {detectedZodiac}</Text> : null}
            </>
          ) : (
            <>
              <Text style={styles.label}>Zodiac Sign</Text>
              <View style={styles.zodiacGrid}>
                {zodiacOptions.map((sign) => (
                  <ZodiacChip
                    key={sign}
                    sign={sign}
                    active={selectedZodiac === sign}
                    onPress={() => setSelectedZodiac(sign)}
                  />
                ))}
              </View>
            </>
          )}

          <Text style={styles.label}>Main Focus</Text>
          <SegmentedControl value={mainFocus} options={focusOptions} onChange={setMainFocus} />

          <PrimaryButton label="Generate Prediction" onPress={buildReport} />
        </SectionCard>

        {report ? (
          <>
            <View style={styles.reportHero}>
              <Text style={styles.reportHeroTitle}>{report.zodiacName} Reading</Text>
              <Text style={styles.reportHeroText}>{report.header}</Text>
            </View>

            <ReportSection
              title="Core Personality"
              eyebrow={report.nakshatraStyle}
              lines={[
                `Outer personality: ${report.corePersonality.outer}`,
                `Inner personality: ${report.corePersonality.inner}`,
                `How others see you: ${report.corePersonality.othersSee}`,
                `Hidden traits: ${report.corePersonality.hidden}`
              ]}
            />
            <View style={styles.dualGrid}>
              <InsightCard
                title="Money"
                accent={colors.gold}
                items={[
                  { label: "Rating", value: report.money.rating },
                  { label: "Trend", value: report.money.earlyVsLater },
                  { label: "Strength", value: report.money.strengthAreas },
                  { label: "Warning", value: report.money.warning },
                  { label: "Advice", value: report.money.advice }
                ]}
              />
              <InsightCard
                title="Career"
                accent={colors.primary}
                items={[
                  { label: "Best fields", value: report.career.bestFields },
                  { label: "Timeline", value: report.career.timeline },
                  { label: "Growth", value: report.career.growthPattern },
                  { label: "Key insight", value: report.career.keyInsight }
                ]}
              />
            </View>
            <ReportSection
              title="Respect"
              lines={[
                `Rating improvement over time: ${report.respect.ratingImprovement}`,
                `Why people misunderstand you: ${report.respect.misunderstanding}`,
                `Main issue: ${report.respect.mainIssue}`,
                `Solution: ${report.respect.solution}`
              ]}
            />
            <View style={styles.dualGrid}>
              <InsightCard
                title="Love"
                accent={colors.danger}
                items={[
                  { label: "Nature", value: report.love.emotionalNature },
                  { label: "Weakness", value: report.love.weakness },
                  { label: "Timeline", value: report.love.loveTimeline },
                  { label: "Partner type", value: report.love.partnerType }
                ]}
              />
              <InsightCard
                title="Health"
                accent={colors.success}
                items={[
                  { label: "Rating", value: report.health.rating },
                  { label: "Mind & body", value: report.health.issues },
                  { label: "Advice", value: report.health.advice }
                ]}
              />
            </View>
            <ReportSection
              title="Marriage"
              lines={[
                `Likely age range: ${report.marriage.likelyAgeRange}`,
                `Partner personality: ${report.marriage.partnerPersonality}`,
                `Marriage impact on life: ${report.marriage.impact}`
              ]}
            />
            <ReportSection
              title="Current Year Prediction"
              lines={[
                `Money: ${report.currentYear.money}`,
                `Career: ${report.currentYear.career}`,
                `Respect: ${report.currentYear.respect}`,
                `Love: ${report.currentYear.love}`,
                `Key Warning: ${report.currentYear.warning}`
              ]}
            />
            <View style={styles.dualGrid}>
              <InsightCard
                title="Lucky Factors"
                accent={colors.gold}
                items={[
                  { label: "Numbers", value: report.lucky.numbers },
                  { label: "Colors", value: report.lucky.colors },
                  { label: "Day", value: report.lucky.day },
                  { label: "Habits", value: report.lucky.habits }
                ]}
              />
              <InsightCard
                title="Final Truth"
                accent={colors.warning}
                items={[
                  { label: "Strength", value: report.finalTruth.strength },
                  { label: "Weakness", value: report.finalTruth.weakness },
                  { label: "Closing", value: report.finalTruth.closing },
                  { label: "Guidance", value: report.finalTruth.guidanceLine }
                ]}
              />
            </View>
          </>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

function ZodiacChip({ sign, active, onPress }: { sign: ZodiacName; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.zodiacChip, active ? styles.zodiacChipActive : undefined]} onPress={onPress}>
      <Text style={[styles.zodiacChipText, active ? styles.zodiacChipTextActive : undefined]}>{sign}</Text>
    </Pressable>
  );
}

function ReportSection({ title, eyebrow, lines }: { title: string; eyebrow?: string; lines: string[] }) {
  return (
    <SectionCard title={title}>
      {eyebrow ? <Text style={styles.reportEyebrow}>{eyebrow}</Text> : null}
      {lines.map((line, index) => (
        <Text key={`${title}-${index}`} style={styles.body}>
          {line}
        </Text>
      ))}
    </SectionCard>
  );
}

function InsightCard({
  title,
  accent,
  items
}: {
  title: string;
  accent: string;
  items: { label: string; value: string }[];
}) {
  return (
    <View style={styles.insightCard}>
      <View style={[styles.insightAccent, { backgroundColor: accent }]} />
      <Text style={styles.insightTitle}>{title}</Text>
      {items.map((item) => (
        <View key={`${title}-${item.label}`} style={styles.insightRow}>
          <Text style={styles.insightLabel}>{item.label}</Text>
          <Text style={styles.insightValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1
  },
  label: {
    color: colors.textMuted,
    marginBottom: 6,
    fontWeight: "600",
    fontSize: 12
  },
  detectedText: {
    color: colors.gold,
    fontSize: 12,
    marginBottom: 10,
    marginTop: -4
  },
  zodiacGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12
  },
  zodiacChip: {
    width: "31%",
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6
  },
  zodiacChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary
  },
  zodiacChipText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center"
  },
  zodiacChipTextActive: {
    color: colors.text
  },
  reportHero: {
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(216,177,90,0.24)",
    backgroundColor: "rgba(216,177,90,0.08)"
  },
  reportHeroTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6
  },
  reportHeroText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 20
  },
  reportEyebrow: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8
  },
  dualGrid: {
    gap: 10,
    marginBottom: 10
  },
  insightCard: {
    backgroundColor: colors.panel,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12
  },
  insightAccent: {
    width: 36,
    height: 4,
    borderRadius: 999,
    marginBottom: 10
  },
  insightTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 10
  },
  insightRow: {
    marginBottom: 10
  },
  insightLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginBottom: 3
  },
  insightValue: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 18
  },
  body: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6
  }
});
