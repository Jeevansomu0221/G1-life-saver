import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Screen } from "@/components/Screen";
import { SectionCard } from "@/components/SectionCard";
import { getChapterMeta, getDailySlokaReference } from "@/constants/gitaDaily";
import { gitaService } from "@/services/gitaService";
import { useAppData } from "@/state/AppDataContext";
import { colors } from "@/theme/colors";

export function BhagvadgitaDailyScreen() {
  const daily = useMemo(() => getDailySlokaReference(), []);
  const [browseChapter, setBrowseChapter] = useState(daily.chapter);
  const [browseSloka, setBrowseSloka] = useState(daily.sloka);
  const { settings, markGitaDailyReading } = useAppData();
  const [dailySlokaText, setDailySlokaText] = useState("");
  const [dailyTransliteration, setDailyTransliteration] = useState("");
  const [dailyMeaning, setDailyMeaning] = useState("");
  const [browseSlokaText, setBrowseSlokaText] = useState("");
  const [browseTransliteration, setBrowseTransliteration] = useState("");
  const [browseMeaning, setBrowseMeaning] = useState("");
  const [loadingDailySloka, setLoadingDailySloka] = useState(false);
  const [loadingBrowseSloka, setLoadingBrowseSloka] = useState(false);
  const [dailyLoadError, setDailyLoadError] = useState<string>();
  const [browseLoadError, setBrowseLoadError] = useState<string>();
  const [showOriginalText, setShowOriginalText] = useState(false);

  const chapterMeta = getChapterMeta(browseChapter);
  const maxSloka = chapterMeta?.slokaCount ?? 1;
  const canGoPrevChapter = browseChapter > 1;
  const canGoNextChapter = browseChapter < 18;
  const canGoPrevSloka = browseSloka > 1;
  const canGoNextSloka = browseSloka < maxSloka;
  const todayKey = new Date().toISOString().slice(0, 10);
  const alreadyMarkedToday = settings.gitaDaily.lastReadDate === todayKey;

  const dailyReference = `Bhagavad Gita ${daily.chapter}.${daily.sloka}`;
  const browseReference = `Bhagavad Gita ${browseChapter}.${browseSloka}`;

  useEffect(() => {
    let active = true;

    async function loadDailySloka() {
      setLoadingDailySloka(true);
      setDailyLoadError(undefined);
      try {
        const result = await gitaService.getSloka(daily.chapter, daily.sloka);
        if (!active) return;
        setDailySlokaText(result.slok);
        setDailyTransliteration(result.transliteration);
        setDailyMeaning(result.meaning);
      } catch (error) {
        if (!active) return;
        setDailyLoadError(error instanceof Error ? error.message : "Unable to load this sloka right now.");
        setDailySlokaText("");
        setDailyTransliteration("");
        setDailyMeaning("");
      } finally {
        if (active) {
          setLoadingDailySloka(false);
        }
      }
    }

    loadDailySloka().catch(() => {
      if (!active) return;
      setLoadingDailySloka(false);
      setDailyLoadError("Unable to load this sloka right now.");
    });

    return () => {
      active = false;
    };
  }, [daily.chapter, daily.sloka]);

  useEffect(() => {
    let active = true;

    async function loadBrowseSloka() {
      setLoadingBrowseSloka(true);
      setBrowseLoadError(undefined);
      try {
        const result = await gitaService.getSloka(browseChapter, browseSloka);
        if (!active) return;
        setBrowseSlokaText(result.slok);
        setBrowseTransliteration(result.transliteration);
        setBrowseMeaning(result.meaning);
      } catch (error) {
        if (!active) return;
        setBrowseLoadError(error instanceof Error ? error.message : "Unable to load this sloka right now.");
        setBrowseSlokaText("");
        setBrowseTransliteration("");
        setBrowseMeaning("");
      } finally {
        if (active) {
          setLoadingBrowseSloka(false);
        }
      }
    }

    loadBrowseSloka().catch(() => {
      if (!active) return;
      setLoadingBrowseSloka(false);
      setBrowseLoadError("Unable to load this sloka right now.");
    });

    return () => {
      active = false;
    };
  }, [browseChapter, browseSloka]);

  const moveChapter = (direction: -1 | 1) => {
    const next = Math.min(18, Math.max(1, browseChapter + direction));
    const nextMeta = getChapterMeta(next);
    setBrowseChapter(next);
    setBrowseSloka((current) => {
      const nextMax = nextMeta?.slokaCount ?? 1;
      return Math.min(current, nextMax);
    });
  };

  const moveSloka = (direction: -1 | 1) => {
    setBrowseSloka((current) => {
      const next = current + direction;
      if (next < 1) return 1;
      if (next > maxSloka) return maxSloka;
      return next;
    });
  };

  return (
    <Screen>
      <SectionCard title="Daily Sloka" rightLabel={dailyReference}>
        <View style={styles.dailyHeader}>
          <Text style={styles.chapterName}>{getChapterMeta(daily.chapter)?.name ?? "Chapter"}</Text>
          <Text style={styles.bookHint}>A single daily verse with meaning first.</Text>
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Show sloka and transliteration</Text>
          <Switch
            value={showOriginalText}
            onValueChange={setShowOriginalText}
            trackColor={{ true: colors.primary, false: colors.panelAlt }}
            thumbColor={colors.text}
          />
        </View>

        <View style={styles.readingCard}>
          {loadingDailySloka ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.gold} size="small" />
              <Text style={styles.body}>Loading sloka...</Text>
            </View>
          ) : null}

          {!loadingDailySloka && dailyLoadError ? <Text style={styles.errorText}>{dailyLoadError}</Text> : null}

          {!loadingDailySloka && !dailyLoadError && (dailySlokaText || dailyTransliteration || dailyMeaning) ? (
            <>
              {showOriginalText && dailySlokaText ? (
                <>
                  <Text style={styles.readingTitle}>Sloka</Text>
                  <Text style={styles.slokaText}>{dailySlokaText}</Text>
                </>
              ) : null}

              {showOriginalText && dailyTransliteration ? <Text style={styles.readingTitle}>Transliteration</Text> : null}
              {showOriginalText && dailyTransliteration ? <Text style={styles.body}>{dailyTransliteration}</Text> : null}

              {dailyMeaning ? <Text style={styles.readingTitle}>Meaning</Text> : null}
              {dailyMeaning ? <Text style={styles.meaningText}>{dailyMeaning}</Text> : null}
            </>
          ) : null}
        </View>

        <Pressable
          style={[styles.markButton, alreadyMarkedToday && styles.markButtonDisabled]}
          onPress={markGitaDailyReading}
          disabled={alreadyMarkedToday}
        >
          <Text style={styles.markButtonText}>
            {alreadyMarkedToday ? "Today's reading already marked" : "Mark today's sloka as read"}
          </Text>
        </Pressable>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Current streak</Text>
            <Text style={styles.statValue}>{settings.gitaDaily.streakCount} day(s)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total read</Text>
            <Text style={styles.statValue}>{settings.gitaDaily.totalReadSlokas} slokas</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard title="Open the Book">
        <View style={styles.controlRow}>
          <Pressable
            style={[styles.navButton, !canGoPrevChapter && styles.navButtonDisabled]}
            disabled={!canGoPrevChapter}
            onPress={() => moveChapter(-1)}
          >
            <Text style={styles.navButtonText}>Prev Chapter</Text>
          </Pressable>
          <Text style={styles.valueText}>Chapter {browseChapter}</Text>
          <Pressable
            style={[styles.navButton, !canGoNextChapter && styles.navButtonDisabled]}
            disabled={!canGoNextChapter}
            onPress={() => moveChapter(1)}
          >
            <Text style={styles.navButtonText}>Next Chapter</Text>
          </Pressable>
        </View>

        <View style={styles.referenceCard}>
          <Text style={styles.referenceLabel}>Chapter</Text>
          <Text style={styles.referenceText}>
            {browseChapter}. {chapterMeta?.name ?? "Chapter"}
          </Text>
          <Text style={styles.referenceMeta}>Slokas in this chapter: {maxSloka}</Text>
        </View>

        <View style={styles.controlRow}>
          <Pressable
            style={[styles.navButton, !canGoPrevSloka && styles.navButtonDisabled]}
            disabled={!canGoPrevSloka}
            onPress={() => moveSloka(-1)}
          >
            <Text style={styles.navButtonText}>Prev Sloka</Text>
          </Pressable>
          <Text style={styles.valueText}>Sloka {browseSloka}</Text>
          <Pressable
            style={[styles.navButton, !canGoNextSloka && styles.navButtonDisabled]}
            disabled={!canGoNextSloka}
            onPress={() => moveSloka(1)}
          >
            <Text style={styles.navButtonText}>Next Sloka</Text>
          </Pressable>
        </View>

        <View style={styles.referenceCard}>
          <Text style={styles.referenceLabel}>Selected verse</Text>
          <Text style={styles.referenceText}>{browseReference}</Text>
        </View>

        <View style={styles.readingCard}>
          {loadingBrowseSloka ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.gold} size="small" />
              <Text style={styles.body}>Loading selected sloka...</Text>
            </View>
          ) : null}

          {!loadingBrowseSloka && browseLoadError ? <Text style={styles.errorText}>{browseLoadError}</Text> : null}

          {!loadingBrowseSloka && !browseLoadError && (browseSlokaText || browseTransliteration || browseMeaning) ? (
            <>
              {showOriginalText && browseSlokaText ? (
                <>
                  <Text style={styles.readingTitle}>Sloka</Text>
                  <Text style={styles.slokaText}>{browseSlokaText}</Text>
                </>
              ) : null}

              {showOriginalText && browseTransliteration ? <Text style={styles.readingTitle}>Transliteration</Text> : null}
              {showOriginalText && browseTransliteration ? <Text style={styles.body}>{browseTransliteration}</Text> : null}

              {browseMeaning ? <Text style={styles.readingTitle}>Meaning</Text> : null}
              {browseMeaning ? <Text style={styles.meaningText}>{browseMeaning}</Text> : null}
            </>
          ) : null}
        </View>
      </SectionCard>

    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  },
  dailyHeader: {
    marginBottom: 10
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 10
  },
  navButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center"
  },
  navButtonDisabled: {
    opacity: 0.45
  },
  navButtonText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "700"
  },
  valueText: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "700"
  },
  chapterName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4
  },
  bookHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  },
  referenceCard: {
    backgroundColor: "rgba(216,177,90,0.08)",
    borderColor: "rgba(216,177,90,0.24)",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 2,
    marginBottom: 10
  },
  referenceLabel: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4
  },
  referenceText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700"
  },
  referenceMeta: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10
  },
  toggleLabel: {
    color: colors.text,
    flex: 1,
    fontSize: 12,
    fontWeight: "700"
  },
  readingCard: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  readingTitle: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4
  },
  slokaText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 24
  },
  meaningText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 21
  },
  errorText: {
    color: "#FFB4B4",
    fontSize: 12,
    lineHeight: 18
  },
  markButton: {
    backgroundColor: colors.gold,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 8
  },
  markButtonDisabled: {
    opacity: 0.55
  },
  markButtonText: {
    color: "#231708",
    fontSize: 12,
    fontWeight: "800"
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.card,
    padding: 10
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginBottom: 4
  },
  statValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700"
  }
});
