import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Screen } from "@/components/Screen";
import { SectionCard } from "@/components/SectionCard";
import { krishnaQuotes } from "@/constants/quotes";
import { useAppData } from "@/state/AppDataContext";
import { colors } from "@/theme/colors";
import { formatAlarmTime, formatDisplayDate, getTodayTasks, getUpcomingTaskAlarms, isTaskOverdue } from "@/utils/date";

export function HomeScreen() {
  const { tasks, toggleTaskAlarm } = useAppData();
  const todayTasks = getTodayTasks(tasks);
  const upcomingAlarms = getUpcomingTaskAlarms(tasks).slice(0, 4);
  const quote = krishnaQuotes[new Date().getDate() % krishnaQuotes.length];

  return (
    <Screen>
      <LinearGradient colors={["#132B57", "#0D1730", "#080D1A"]} style={styles.hero}>
        <Text style={styles.kicker}>G1 - Life Saver</Text>
        <Text style={styles.heading}>Walk through the day with focus, rhythm, and purpose.</Text>
        <Text style={styles.quote}>{quote}</Text>
      </LinearGradient>

      <SectionCard title="Today's Tasks" subtitle={`${todayTasks.length} tasks today`}>
        {todayTasks.length === 0 ? (
          <Text style={styles.empty}>No tasks planned for today.</Text>
        ) : (
          todayTasks.map((task) => (
            <View key={task.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{task.title}</Text>
                <Text style={[styles.itemMeta, isTaskOverdue(task) ? styles.overdue : undefined]}>
                  {formatDisplayDate(task.dateTime)}
                  {isTaskOverdue(task) ? "  •  Overdue" : ""}
                </Text>
              </View>
              <Text style={[styles.badge, task.completed ? styles.doneBadge : styles.pendingBadge]}>
                {task.completed ? "Done" : "Open"}
              </Text>
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard title="Upcoming Task Alarms" subtitle="Next alarms">
        {upcomingAlarms.length === 0 ? (
          <Text style={styles.empty}>No active task alarms yet.</Text>
        ) : (
          upcomingAlarms.map(({ task }) => (
            <View key={task.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{task.title}</Text>
                <Text style={styles.itemMeta}>{formatAlarmTime(task.alarm?.time || "07:00")}</Text>
              </View>
              <Switch
                value={!!task.alarm?.enabled}
                onValueChange={() => toggleTaskAlarm(task.id)}
                trackColor={{ true: colors.primary, false: colors.panelAlt }}
                thumbColor={colors.text}
              />
            </View>
          ))
        )}
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(216,177,90,0.24)"
  },
  kicker: {
    color: colors.gold,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    fontWeight: "700",
    marginBottom: 6,
    fontSize: 11
  },
  heading: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800"
  },
  quote: {
    color: colors.textMuted,
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  itemTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13
  },
  itemMeta: {
    color: colors.textMuted,
    marginTop: 2,
    fontSize: 11
  },
  badge: {
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontWeight: "700",
    fontSize: 11
  },
  doneBadge: {
    backgroundColor: "rgba(75,196,138,0.16)",
    color: colors.success
  },
  pendingBadge: {
    backgroundColor: "rgba(76,139,245,0.16)",
    color: colors.primary
  },
  overdue: {
    color: colors.warning
  },
  empty: {
    color: colors.textMuted,
    lineHeight: 18,
    fontSize: 12
  }
});
