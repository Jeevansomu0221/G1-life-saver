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
  const [chapter, setChapter] = useState(daily.chapter);
  const [sloka, setSloka] = useState(daily.sloka);
  const { settings, markGitaDailyReading } = useAppData();
  const [slokaText, setSlokaText] = useState("");
  const [transliteration, setTransliteration] = useState("");
  const [meaning, setMeaning] = useState("");
  const [loadingSloka, setLoadingSloka] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [showOriginalText, setShowOriginalText] = useState(false);

  const chapterMeta = getChapterMeta(chapter);
  const maxSloka = chapterMeta?.slokaCount ?? 1;
  const canGoPrevChapter = chapter > 1;
  const canGoNextChapter = chapter < 18;
  const canGoPrevSloka = sloka > 1;
  const canGoNextSloka = sloka < maxSloka;
  const todayKey = new Date().toISOString().slice(0, 10);
  const alreadyMarkedToday = settings.gitaDaily.lastReadDate === todayKey;

  const currentReference = `Bhagavad Gita ${chapter}.${sloka}`;

  useEffect(() => {
    let active = true;

    async function loadSloka() {
      setLoadingSloka(true);
      setLoadError(undefined);
      try {
        const result = await gitaService.getSloka(chapter, sloka);
        if (!active) return;
        setSlokaText(result.slok);
        setTransliteration(result.transliteration);
        setMeaning(result.meaning);
      } catch (error) {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : "Unable to load this sloka right now.");
        setSlokaText("");
        setTransliteration("");
        setMeaning("");
      } finally {
        if (active) {
          setLoadingSloka(false);
        }
      }
    }

    loadSloka().catch(() => {
      if (!active) return;
      setLoadingSloka(false);
      setLoadError("Unable to load this sloka right now.");
    });

    return () => {
      active = false;
    };
  }, [chapter, sloka]);

  const moveChapter = (direction: -1 | 1) => {
    const next = Math.min(18, Math.max(1, chapter + direction));
    const nextMeta = getChapterMeta(next);
    setChapter(next);
    setSloka((current) => {
      const nextMax = nextMeta?.slokaCount ?? 1;
      return Math.min(current, nextMax);
    });
  };

  const moveSloka = (direction: -1 | 1) => {
    setSloka((current) => {
      const next = current + direction;
      if (next < 1) return 1;
      if (next > maxSloka) return maxSloka;
      return next;
    });
  };

  return (
    <Screen>
      <Text style={styles.pageTitle}>Bhagvadgita Daily</Text>
      <Text style={styles.pageSubtitle}>All chapters and slokas are included. Read one daily and build your streak.</Text>

      <SectionCard title="Browse chapters and slokas" subtitle="Navigate all 18 chapters">
        <View style={styles.controlRow}>
          <Pressable
            style={[styles.navButton, !canGoPrevChapter && styles.navButtonDisabled]}
            disabled={!canGoPrevChapter}
            onPress={() => moveChapter(-1)}
          >
            <Text style={styles.navButtonText}>Prev Chapter</Text>
          </Pressable>
          <Text style={styles.valueText}>Chapter {chapter}</Text>
          <Pressable
            style={[styles.navButton, !canGoNextChapter && styles.navButtonDisabled]}
            disabled={!canGoNextChapter}
            onPress={() => moveChapter(1)}
          >
            <Text style={styles.navButtonText}>Next Chapter</Text>
          </Pressable>
        </View>

        <Text style={styles.chapterName}>{chapterMeta?.name ?? "Chapter"}</Text>
        <Text style={styles.body}>Slokas in this chapter: {maxSloka}</Text>

        <View style={styles.controlRow}>
          <Pressable
            style={[styles.navButton, !canGoPrevSloka && styles.navButtonDisabled]}
            disabled={!canGoPrevSloka}
            onPress={() => moveSloka(-1)}
          >
            <Text style={styles.navButtonText}>Prev Sloka</Text>
          </Pressable>
          <Text style={styles.valueText}>Sloka {sloka}</Text>
          <Pressable
            style={[styles.navButton, !canGoNextSloka && styles.navButtonDisabled]}
            disabled={!canGoNextSloka}
            onPress={() => moveSloka(1)}
          >
            <Text style={styles.navButtonText}>Next Sloka</Text>
          </Pressable>
        </View>

        <View style={styles.referenceCard}>
          <Text style={styles.referenceText}>{currentReference}</Text>
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
          {loadingSloka ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.gold} size="small" />
              <Text style={styles.body}>Loading sloka...</Text>
            </View>
          ) : null}

          {!loadingSloka && loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}

          {!loadingSloka && !loadError && (slokaText || transliteration || meaning) ? (
            <>
              {showOriginalText && slokaText ? (
                <>
                  <Text style={styles.readingTitle}>Sloka</Text>
                  <Text style={styles.slokaText}>{slokaText}</Text>
                </>
              ) : null}

              {showOriginalText && transliteration ? <Text style={styles.readingTitle}>Transliteration</Text> : null}
              {showOriginalText && transliteration ? <Text style={styles.body}>{transliteration}</Text> : null}

              {meaning ? <Text style={styles.readingTitle}>Meaning</Text> : null}
              {meaning ? <Text style={styles.body}>{meaning}</Text> : null}
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

        <Text style={styles.streakText}>Current streak: {settings.gitaDaily.streakCount} day(s)</Text>
        <Text style={styles.streakText}>Total slokas read: {settings.gitaDaily.totalReadSlokas}</Text>
      </SectionCard>

    </Screen>
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
  body: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
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
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4
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
  referenceText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700"
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
  streakText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  }
});
