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

type DateChoice = "today" | "tomorrow" | "custom";
type Meridiem = "AM" | "PM";

const taskRecurringOptions: { label: string; value: RecurringTaskType }[] = [
  { label: "No Repeat", value: "none" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" }
];

const dateChoiceOptions: { label: string; value: DateChoice }[] = [
  { label: "Today", value: "today" },
  { label: "Tomorrow", value: "tomorrow" },
  { label: "Custom", value: "custom" }
];

function toDateInput(iso?: string) {
  const date = iso ? new Date(iso) : new Date();
  return date.toISOString().slice(0, 10);
}

function to24HourTimeInput(iso?: string) {
  const date = iso ? new Date(iso) : new Date();
  return date.toTimeString().slice(0, 5);
}

function mergeDateAndTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function inferDateChoice(dateValue: string) {
  const today = toDateInput();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = toDateInput(tomorrowDate.toISOString());

  if (dateValue === today) return "today";
  if (dateValue === tomorrow) return "tomorrow";
  return "custom";
}

function applyDateChoice(choice: DateChoice, currentCustomDate: string) {
  if (choice === "today") {
    return toDateInput();
  }
  if (choice === "tomorrow") {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    return toDateInput(next.toISOString());
  }
  return currentCustomDate || toDateInput();
}

function to12HourParts(time24: string) {
  const [rawHours, rawMinutes] = time24.split(":").map(Number);
  const meridiem: Meridiem = rawHours >= 12 ? "PM" : "AM";
  const hours12 = rawHours % 12 || 12;
  return {
    time: `${String(hours12).padStart(2, "0")}:${String(rawMinutes).padStart(2, "0")}`,
    meridiem
  };
}

function to24HourValue(time12: string, meridiem: Meridiem) {
  const match = time12.trim().match(/^(\d{1,2})(?::(\d{1,2}))?$/);
  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    return null;
  }

  if (meridiem === "AM") {
    hours = hours === 12 ? 0 : hours;
  } else {
    hours = hours === 12 ? 12 : hours + 12;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
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
  const [taskDateChoice, setTaskDateChoice] = useState<DateChoice>("today");
  const [customTaskDate, setCustomTaskDate] = useState(toDateInput());
  const [taskTime, setTaskTime] = useState("07:00");
  const [taskMeridiem, setTaskMeridiem] = useState<Meridiem>("AM");
  const [taskRecurring, setTaskRecurring] = useState<RecurringTaskType>("none");
  const [taskAlarmEnabled, setTaskAlarmEnabled] = useState(false);
  const [taskAlarmTime, setTaskAlarmTime] = useState("07:00");
  const [taskAlarmMeridiem, setTaskAlarmMeridiem] = useState<Meridiem>("AM");
  const [taskAlarmSnooze, setTaskAlarmSnooze] = useState<5 | 10>(5);

  const activeAlarmTask = useMemo(() => tasks.find((task) => task.id === activeAlarmTaskId), [activeAlarmTaskId, tasks]);

  const resetTaskForm = () => {
    setTaskTitle("");
    setTaskDescription("");
    setTaskDate(toDateInput());
    setTaskDateChoice("today");
    setCustomTaskDate(toDateInput());
    setTaskTime("07:00");
    setTaskMeridiem("AM");
    setTaskRecurring("none");
    setTaskAlarmEnabled(false);
    setTaskAlarmTime("07:00");
    setTaskAlarmMeridiem("AM");
    setTaskAlarmSnooze(5);
    setEditingTask(null);
  };

  const openTaskEditor = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setTaskTitle(task.title);
      setTaskDescription(task.description);
      const nextTaskDate = toDateInput(task.dateTime);
      const nextTaskTime = to12HourParts(to24HourTimeInput(task.dateTime));
      const nextAlarmTime = to12HourParts(task.alarm?.time || to24HourTimeInput(task.dateTime));
      setTaskDate(nextTaskDate);
      setTaskDateChoice(inferDateChoice(nextTaskDate));
      setCustomTaskDate(nextTaskDate);
      setTaskTime(nextTaskTime.time);
      setTaskMeridiem(nextTaskTime.meridiem);
      setTaskRecurring(task.recurring);
      setTaskAlarmEnabled(!!task.alarm?.enabled);
      setTaskAlarmTime(nextAlarmTime.time);
      setTaskAlarmMeridiem(nextAlarmTime.meridiem);
      setTaskAlarmSnooze(task.alarm?.snoozeMinutes || 5);
    } else {
      resetTaskForm();
      const currentTime = to12HourParts(to24HourTimeInput());
      setTaskTime(currentTime.time);
      setTaskMeridiem(currentTime.meridiem);
      setTaskAlarmTime(currentTime.time);
      setTaskAlarmMeridiem(currentTime.meridiem);
    }
    setTaskModalOpen(true);
  };

  const submitTask = async () => {
    const finalTaskTime = to24HourValue(taskTime, taskMeridiem);
    const finalAlarmTime = to24HourValue(taskAlarmTime, taskAlarmMeridiem);

    if (!finalTaskTime || (taskAlarmEnabled && !finalAlarmTime)) {
      return;
    }

    const payload = {
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      dateTime: mergeDateAndTime(taskDate, finalTaskTime),
      recurring: taskRecurring,
      completed: editingTask?.completed ?? false,
      alarm: {
        enabled: taskAlarmEnabled,
        time: finalAlarmTime || "07:00",
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
            <View style={styles.modalHeader}>
              <Pressable
                onPress={() => {
                  setTaskModalOpen(false);
                  resetTaskForm();
                }}
                hitSlop={10}
              >
                <Text style={styles.backText}>Back</Text>
              </Pressable>
              <Text style={styles.modalTitle}>{editingTask ? "Edit Task" : "New Task"}</Text>
              <View style={styles.headerSpacer} />
            </View>
            <LabeledInput label="Title" value={taskTitle} onChangeText={setTaskTitle} placeholder="Morning revision" />
            <LabeledInput
              label="Description"
              value={taskDescription}
              onChangeText={setTaskDescription}
              placeholder="What must be done?"
              multiline
            />
            <Text style={styles.fieldLabel}>Date</Text>
            <SegmentedControl
              value={taskDateChoice}
              options={dateChoiceOptions}
              onChange={(value) => {
                setTaskDateChoice(value);
                const nextDate = applyDateChoice(value, customTaskDate);
                setTaskDate(nextDate);
                if (value === "custom") {
                  setCustomTaskDate(nextDate);
                }
              }}
            />
            {taskDateChoice === "custom" ? (
              <LabeledInput
                label="Custom Date"
                value={customTaskDate}
                onChangeText={(value) => {
                  setCustomTaskDate(value);
                  setTaskDate(value);
                }}
                placeholder="YYYY-MM-DD"
              />
            ) : null}
            <Text style={styles.fieldLabel}>Time</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeInputWrap}>
                <LabeledInput label=" " value={taskTime} onChangeText={setTaskTime} placeholder="07:30" />
              </View>
              <View style={styles.meridiemWrap}>
                <Text style={styles.fieldLabel}>AM / PM</Text>
                <SegmentedControl
                  value={taskMeridiem}
                  options={[
                    { label: "AM", value: "AM" },
                    { label: "PM", value: "PM" }
                  ]}
                  onChange={setTaskMeridiem}
                />
              </View>
            </View>
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
                <Text style={styles.fieldLabel}>Alarm Time</Text>
                <View style={styles.timeRow}>
                  <View style={styles.timeInputWrap}>
                    <LabeledInput label=" " value={taskAlarmTime} onChangeText={setTaskAlarmTime} placeholder="07:00" />
                  </View>
                  <View style={styles.meridiemWrap}>
                    <Text style={styles.fieldLabel}>AM / PM</Text>
                    <SegmentedControl
                      value={taskAlarmMeridiem}
                      options={[
                        { label: "AM", value: "AM" },
                        { label: "PM", value: "PM" }
                      ]}
                      onChange={setTaskAlarmMeridiem}
                    />
                  </View>
                </View>
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
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800"
  },
  backText: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "700"
  },
  headerSpacer: {
    width: 32
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
  },
  timeRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start"
  },
  timeInputWrap: {
    flex: 1
  },
  meridiemWrap: {
    width: 112
  }
});
