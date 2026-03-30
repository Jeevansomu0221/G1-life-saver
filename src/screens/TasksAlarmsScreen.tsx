import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { AlarmRingModal } from "@/components/AlarmRingModal";
import { LabeledInput } from "@/components/LabeledInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { SectionCard } from "@/components/SectionCard";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useAppData } from "@/state/AppDataContext";
import { colors } from "@/theme/colors";
import { RecurringTaskType, Task } from "@/types/domain";
import { formatAlarmTime, formatDisplayDate, isTaskOverdue } from "@/utils/date";

const taskRecurringOptions: { label: string; value: RecurringTaskType }[] = [
  { label: "No Repeat", value: "none" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" }
];

function toDateInput(iso?: string) {
  const date = iso ? new Date(iso) : new Date();
  return date.toISOString().slice(0, 10);
}

function toTimeInput(iso?: string) {
  const date = iso ? new Date(iso) : new Date();
  return date.toTimeString().slice(0, 5);
}

function mergeDateAndTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

export function TasksAlarmsScreen() {
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    toggleTaskAlarm,
    dismissTaskAlarm,
    snoozeTaskAlarm,
    activeAlarmTaskId
  } = useAppData();
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDate, setTaskDate] = useState(toDateInput());
  const [taskTime, setTaskTime] = useState(toTimeInput());
  const [taskRecurring, setTaskRecurring] = useState<RecurringTaskType>("none");
  const [taskAlarmEnabled, setTaskAlarmEnabled] = useState(false);
  const [taskAlarmTime, setTaskAlarmTime] = useState("07:00");
  const [taskAlarmSnooze, setTaskAlarmSnooze] = useState<5 | 10>(5);

  const activeAlarmTask = useMemo(() => tasks.find((task) => task.id === activeAlarmTaskId), [activeAlarmTaskId, tasks]);

  const resetTaskForm = () => {
    setTaskTitle("");
    setTaskDescription("");
    setTaskDate(toDateInput());
    setTaskTime(toTimeInput());
    setTaskRecurring("none");
    setTaskAlarmEnabled(false);
    setTaskAlarmTime("07:00");
    setTaskAlarmSnooze(5);
    setEditingTask(null);
  };

  const openTaskEditor = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setTaskTitle(task.title);
      setTaskDescription(task.description);
      setTaskDate(toDateInput(task.dateTime));
      setTaskTime(toTimeInput(task.dateTime));
      setTaskRecurring(task.recurring);
      setTaskAlarmEnabled(!!task.alarm?.enabled);
      setTaskAlarmTime(task.alarm?.time || toTimeInput(task.dateTime));
      setTaskAlarmSnooze(task.alarm?.snoozeMinutes || 5);
    } else {
      resetTaskForm();
      setTaskAlarmTime(toTimeInput());
    }
    setTaskModalOpen(true);
  };

  const submitTask = async () => {
    const payload = {
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      dateTime: mergeDateAndTime(taskDate, taskTime),
      recurring: taskRecurring,
      completed: editingTask?.completed ?? false,
      alarm: {
        enabled: taskAlarmEnabled,
        time: taskAlarmTime,
        snoozeMinutes: taskAlarmSnooze
      }
    };

    if (!payload.title) return;

    if (editingTask) {
      await updateTask(editingTask.id, payload);
    } else {
      await addTask(payload);
    }
    setTaskModalOpen(false);
    resetTaskForm();
  };

  return (
    <>
      <Screen>
        <Text style={styles.heading}>Tasks with built-in alarms.</Text>
        <Text style={styles.subheading}>
          Every task can now carry its own alarm. The separate alarm list is removed so your workflow stays in one place.
        </Text>

        <SectionCard title="Task Planner" subtitle="Add reminders, recurring duties, and an alarm directly inside each task">
          <PrimaryButton label="Create Task" onPress={() => openTaskEditor()} />
          <View style={styles.listSpacing} />
          {tasks.length === 0 ? (
            <Text style={styles.empty}>No tasks yet. Create one and attach an alarm if you want it to ring.</Text>
          ) : (
            tasks
              .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
              .map((task) => (
                <View key={task.id} style={styles.itemCard}>
                  <View style={styles.inlineBetween}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{task.title}</Text>
                      <Text style={[styles.itemMeta, isTaskOverdue(task) ? styles.overdue : undefined]}>
                        {formatDisplayDate(task.dateTime)}
                      </Text>
                    </View>
                    <Pressable onPress={() => toggleTaskCompletion(task.id)}>
                      <Text style={[styles.statePill, task.completed ? styles.donePill : styles.todoPill]}>
                        {task.completed ? "Completed" : "Mark Done"}
                      </Text>
                    </Pressable>
                  </View>

                  {!!task.description && <Text style={styles.description}>{task.description}</Text>}

                  <View style={styles.metaRow}>
                    <Text style={styles.recurring}>Recurring: {task.recurring}</Text>
                    {task.alarm?.enabled ? <Text style={styles.recurring}>Alarm: {formatAlarmTime(task.alarm.time)}</Text> : null}
                  </View>

                  <View style={styles.alarmToggleRow}>
                    <Text style={styles.fieldLabel}>Task Alarm</Text>
                    <Switch
                      value={!!task.alarm?.enabled}
                      onValueChange={() => toggleTaskAlarm(task.id)}
                      trackColor={{ true: colors.primary, false: colors.panelAlt }}
                      thumbColor={colors.text}
                    />
                  </View>

                  <View style={styles.actionRow}>
                    <PrimaryButton label="Edit" variant="ghost" onPress={() => openTaskEditor(task)} />
                    <PrimaryButton label="Delete" variant="danger" onPress={() => deleteTask(task.id)} />
                  </View>
                </View>
              ))
          )}
        </SectionCard>
      </Screen>

      <Modal visible={taskModalOpen} animationType="slide">
        <Screen scroll={false} contentStyle={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>{editingTask ? "Edit Task" : "New Task"}</Text>
            <LabeledInput label="Title" value={taskTitle} onChangeText={setTaskTitle} placeholder="Morning revision" />
            <LabeledInput
              label="Description"
              value={taskDescription}
              onChangeText={setTaskDescription}
              placeholder="What must be done?"
              multiline
            />
            <LabeledInput label="Date" value={taskDate} onChangeText={setTaskDate} placeholder="YYYY-MM-DD" />
            <LabeledInput label="Time" value={taskTime} onChangeText={setTaskTime} placeholder="HH:MM" />
            <Text style={styles.fieldLabel}>Recurring</Text>
            <SegmentedControl value={taskRecurring} options={taskRecurringOptions} onChange={setTaskRecurring} />

            <View style={styles.alarmToggleRow}>
              <Text style={styles.fieldLabel}>Add alarm to this task</Text>
              <Switch
                value={taskAlarmEnabled}
                onValueChange={setTaskAlarmEnabled}
                trackColor={{ true: colors.primary, false: colors.panelAlt }}
                thumbColor={colors.text}
              />
            </View>

            {taskAlarmEnabled ? (
              <>
                <LabeledInput label="Alarm Time" value={taskAlarmTime} onChangeText={setTaskAlarmTime} placeholder="07:00" />
                <Text style={styles.fieldLabel}>Snooze</Text>
                <SegmentedControl
                  value={String(taskAlarmSnooze)}
                  options={[
                    { label: "5 min", value: "5" },
                    { label: "10 min", value: "10" }
                  ]}
                  onChange={(value) => setTaskAlarmSnooze(Number(value) as 5 | 10)}
                />
              </>
            ) : null}

            <View style={styles.actionRow}>
              <PrimaryButton label="Save Task" onPress={submitTask} />
              <PrimaryButton
                label="Cancel"
                variant="ghost"
                onPress={() => {
                  setTaskModalOpen(false);
                  resetTaskForm();
                }}
              />
            </View>
          </ScrollView>
        </Screen>
      </Modal>

      <AlarmRingModal
        visible={!!activeAlarmTask}
        alarm={
          activeAlarmTask
            ? {
                id: activeAlarmTask.id,
                label: activeAlarmTask.title,
                time: activeAlarmTask.alarm?.time || "07:00",
                snoozeMinutes: activeAlarmTask.alarm?.snoozeMinutes || 5
              }
            : undefined
        }
        onDismiss={() => {
          if (activeAlarmTask) {
            dismissTaskAlarm(activeAlarmTask.id);
          }
        }}
        onSnooze={() => {
          if (activeAlarmTask) {
            snoozeTaskAlarm(activeAlarmTask.id);
          }
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  heading: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26
  },
  subheading: {
    color: colors.textMuted,
    marginTop: 6,
    marginBottom: 10,
    lineHeight: 18,
    fontSize: 12
  },
  listSpacing: {
    height: 8
  },
  itemCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 8
  },
  inlineBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
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
  description: {
    color: colors.textMuted,
    lineHeight: 17,
    marginTop: 8,
    fontSize: 12
  },
  recurring: {
    color: colors.gold,
    marginTop: 8,
    fontWeight: "600",
    fontSize: 11
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10
  },
  statePill: {
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontWeight: "700",
    fontSize: 11
  },
  donePill: {
    backgroundColor: "rgba(75,196,138,0.16)",
    color: colors.success
  },
  todoPill: {
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
  },
  modalContent: {
    paddingBottom: 18
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12
  },
  fieldLabel: {
    color: colors.textMuted,
    marginBottom: 6,
    fontWeight: "600",
    fontSize: 12
  },
  alarmToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 8
  }
});
