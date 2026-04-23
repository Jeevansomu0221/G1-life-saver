import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
    <Screen>
      <Text style={styles.pageTitle}>Predict My Future</Text>
      <Text style={styles.pageSubtitle}>Use your DOB or zodiac sign to generate a personal reading.</Text>

      <SectionCard title="Your Inputs" subtitle="Simple details only">
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
          <ReportSection title="Header" lines={[report.header]} />
          <ReportSection
            title="Core Personality"
            subtitle={report.nakshatraStyle}
            lines={[
              `Outer personality: ${report.corePersonality.outer}`,
              `Inner personality: ${report.corePersonality.inner}`,
              `How others see you: ${report.corePersonality.othersSee}`,
              `Hidden traits: ${report.corePersonality.hidden}`
            ]}
          />
          <ReportSection
            title="Money & Financial Life"
            lines={[
              `Rating: ${report.money.rating}`,
              `Early vs later life trend: ${report.money.earlyVsLater}`,
              `Strength areas: ${report.money.strengthAreas}`,
              `Warning: ${report.money.warning}`,
              `Advice: ${report.money.advice}`
            ]}
          />
          <ReportSection
            title="Career & Future Path"
            lines={[
              `Best career fields: ${report.career.bestFields}`,
              `Timeline: ${report.career.timeline}`,
              `Growth pattern: ${report.career.growthPattern}`,
              `Key insight: ${report.career.keyInsight}`
            ]}
          />
          <ReportSection
            title="Reputation / Respect (Avamanam)"
            lines={[
              `Rating improvement over time: ${report.respect.ratingImprovement}`,
              `Why people misunderstand you: ${report.respect.misunderstanding}`,
              `Main issue: ${report.respect.mainIssue}`,
              `Solution: ${report.respect.solution}`
            ]}
          />
          <ReportSection
            title="Love & Relationships"
            lines={[
              `Emotional nature: ${report.love.emotionalNature}`,
              `Weakness: ${report.love.weakness}`,
              `Love timeline: ${report.love.loveTimeline}`,
              `Partner type: ${report.love.partnerType}`
            ]}
          />
          <ReportSection
            title="Marriage Prediction"
            lines={[
              `Likely age range: ${report.marriage.likelyAgeRange}`,
              `Partner personality: ${report.marriage.partnerPersonality}`,
              `Marriage impact on life: ${report.marriage.impact}`
            ]}
          />
          <ReportSection
            title="Health & Mind"
            lines={[
              `Rating: ${report.health.rating}`,
              `Mental/emotional issues: ${report.health.issues}`,
              `Practical advice: ${report.health.advice}`
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
          <ReportSection
            title="Lucky Factors"
            lines={[
              `Lucky numbers: ${report.lucky.numbers}`,
              `Lucky colors: ${report.lucky.colors}`,
              `Lucky day: ${report.lucky.day}`,
              `Suggested habits/practices: ${report.lucky.habits}`
            ]}
          />
          <ReportSection
            title="Final Truth Section"
            lines={[
              `Core strength: ${report.finalTruth.strength}`,
              `Core weakness: ${report.finalTruth.weakness}`,
              `Powerful closing statement: ${report.finalTruth.closing}`,
              `Guidance Line: ${report.finalTruth.guidanceLine}`
            ]}
          />
        </>
      ) : null}
    </Screen>
  );
}

function ZodiacChip({ sign, active, onPress }: { sign: ZodiacName; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.zodiacChip, active ? styles.zodiacChipActive : undefined]} onPress={onPress}>
      <Text style={[styles.zodiacChipText, active ? styles.zodiacChipTextActive : undefined]}>{sign}</Text>
    </Pressable>
  );
}

function ReportSection({ title, subtitle, lines }: { title: string; subtitle?: string; lines: string[] }) {
  return (
    <SectionCard title={title} subtitle={subtitle}>
      {lines.map((line, index) => (
        <Text key={`${title}-${index}`} style={index === lines.length - 1 && title === "Final Truth Section" ? styles.guidanceLine : styles.body}>
          {line}
        </Text>
      ))}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800"
  },
  pageSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 10
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
  body: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6
  },
  guidanceLine: {
    color: colors.gold,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    fontWeight: "700"
  }
});
