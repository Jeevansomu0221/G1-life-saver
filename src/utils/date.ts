import { Task } from "@/types/domain";

export function formatDisplayDate(dateIso: string) {
  const date = new Date(dateIso);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

export function formatAlarmTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

export function getTodayTasks(tasks: Task[]) {
  const now = new Date();
  return tasks.filter((task) => {
    const date = new Date(task.dateTime);
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  });
}

export function isTaskOverdue(task: Task) {
  return !task.completed && new Date(task.dateTime).getTime() < Date.now();
}

export function nextRecurringTaskDate(currentIso: string, recurring: Task["recurring"]) {
  const date = new Date(currentIso);
  switch (recurring) {
    case "daily":
      date.setDate(date.getDate() + 1);
      return date.toISOString();
    case "weekly":
      date.setDate(date.getDate() + 7);
      return date.toISOString();
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      return date.toISOString();
    default:
      return currentIso;
  }
}

export function getTaskAlarmDate(task: Task) {
  if (!task.alarm?.enabled) {
    return undefined;
  }

  const base = new Date(task.dateTime);
  const [hours, minutes] = task.alarm.time.split(":").map(Number);
  const alarmDate = new Date(base);
  alarmDate.setHours(hours, minutes, 0, 0);
  return alarmDate;
}

export function getUpcomingTaskAlarms(tasks: Task[]) {
  return tasks
    .filter((task) => task.alarm?.enabled && !task.completed)
    .map((task) => ({ task, alarmDate: getTaskAlarmDate(task) }))
    .filter((item): item is { task: Task; alarmDate: Date } => !!item.alarmDate && item.alarmDate.getTime() > Date.now())
    .sort((a, b) => a.alarmDate.getTime() - b.alarmDate.getTime());
}
