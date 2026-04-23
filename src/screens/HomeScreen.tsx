import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Screen } from "@/components/Screen";
import { useAppData } from "@/state/AppDataContext";
import { colors } from "@/theme/colors";
import { formatDisplayDate, isTaskOverdue } from "@/utils/date";

const homeActions = [
  {
    title: "Predict My Future",
    badge: "FUTURE",
    accent: colors.primary,
    screen: "Predict My Future"
  },
  {
    title: "Bhagvadgita Daily",
    badge: "GITA",
    accent: colors.gold,
    screen: "Bhagvadgita Daily"
  },
  {
    title: "Wt Will Happen Today",
    badge: "TODAY",
    accent: colors.warning,
    screen: "Wt Will Happen Today"
  },
  {
    title: "Krishna AI",
    badge: "AI",
    accent: colors.success,
    tab: "Krsna AI"
  }
] as const;

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const { tasks, addTask, toggleTaskCompletion } = useAppData();
  const [addingTask, setAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");

  const visibleTasks = useMemo(
    () =>
      [...tasks]
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
        .slice(0, 6),
    [tasks]
  );

  const submitTask = async () => {
    const title = taskTitle.trim();
    if (!title) return;

    await addTask({
      title,
      description: "",
      dateTime: new Date().toISOString(),
      recurring: "none",
      completed: false,
      alarm: {
        enabled: false,
        time: "09:00",
        snoozeMinutes: 5
      }
    });
    setTaskTitle("");
    setAddingTask(false);
  };

  return (
    <Screen>
      <View style={styles.actionGrid}>
        {homeActions.map((action) => (
          <Pressable
            key={action.title}
            style={styles.actionCard}
            onPress={() => {
              if ("screen" in action) {
                navigation.navigate(action.screen);
              } else {
                navigation.navigate("MainTabs", { screen: action.tab });
              }
            }}
          >
            <View style={styles.actionTopRow}>
              <Text style={[styles.actionBadge, { color: action.accent, borderColor: action.accent }]}>{action.badge}</Text>
              <Text style={[styles.actionArrow, { color: action.accent }]}>{">"}</Text>
            </View>
            <Text style={styles.actionTitle}>{action.title}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.tasksPanel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Tasks</Text>
          <Pressable style={styles.addButton} onPress={() => setAddingTask((current) => !current)}>
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>

        {addingTask ? (
          <View style={styles.addTaskRow}>
            <TextInput
              value={taskTitle}
              onChangeText={setTaskTitle}
              placeholder="Add task"
              placeholderTextColor={colors.textMuted}
              style={styles.taskInput}
              returnKeyType="done"
              onSubmitEditing={submitTask}
            />
            <Pressable style={styles.saveTaskButton} onPress={submitTask}>
              <Text style={styles.saveTaskText}>Add</Text>
            </Pressable>
          </View>
        ) : null}

        {visibleTasks.length === 0 ? (
          <Text style={styles.emptyText}>No tasks yet.</Text>
        ) : (
          visibleTasks.map((task) => (
            <View key={task.id} style={styles.taskRow}>
              <Pressable
                style={[styles.tickCircle, task.completed && styles.tickCircleDone]}
                onPress={() => toggleTaskCompletion(task.id)}
              >
                <Text style={[styles.tickMark, task.completed && styles.tickMarkDone]}>{task.completed ? "\u2713" : ""}</Text>
              </Pressable>
              <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, task.completed && styles.completedText]}>{task.title}</Text>
                <Text style={[styles.taskMeta, isTaskOverdue(task) && styles.overdueText]}>{formatDisplayDate(task.dateTime)}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    marginBottom: 12
  },
  actionCard: {
    width: "48.5%",
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    minHeight: 96,
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  actionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  actionBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.7
  },
  actionArrow: {
    fontSize: 17,
    lineHeight: 18,
    fontWeight: "900"
  },
  actionTitle: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900"
  },
  tasksPanel: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8
  },
  panelTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  addButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.gold
  },
  addButtonText: {
    color: "#231708",
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "900"
  },
  addTaskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10
  },
  taskInput: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 10,
    fontSize: 13
  },
  saveTaskButton: {
    minHeight: 40,
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 12
  },
  saveTaskText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900"
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 10
  },
  tickCircle: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(216,177,90,0.45)",
    backgroundColor: "rgba(216,177,90,0.06)"
  },
  tickCircleDone: {
    backgroundColor: colors.success,
    borderColor: colors.success
  },
  tickMark: {
    color: "#231708",
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "900"
  },
  tickMarkDone: {
    color: "#07140E"
  },
  taskContent: {
    flex: 1
  },
  taskTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700"
  },
  completedText: {
    color: colors.textMuted,
    textDecorationLine: "line-through"
  },
  taskMeta: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2
  },
  overdueText: {
    color: colors.warning
  }
});
