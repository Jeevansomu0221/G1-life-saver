import * as Device from "expo-device";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Task } from "@/types/domain";
import { getTaskAlarmDate } from "@/utils/date";

export const notificationService = {
  async initialize() {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("alarms", {
        name: "Task Alarms",
        importance: Notifications.AndroidImportance.MAX,
        sound: "default",
        vibrationPattern: [0, 300, 150, 300],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
      });

      await Notifications.setNotificationChannelAsync("tasks", {
        name: "Task Reminders",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
        vibrationPattern: [0, 250, 150, 250]
      });
    }

    if (Device.isDevice) {
      const permissions = await Notifications.getPermissionsAsync();
      if (permissions.status !== "granted") {
        await Notifications.requestPermissionsAsync();
      }
    }
  },

  async triggerSnoozeFeedback() {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  async scheduleTask(task: Task) {
    await this.cancelTaskNotifications(task);

    if (task.completed) {
      return {};
    }

    const reminderDate = new Date(task.dateTime);
    let reminderNotificationId: string | undefined;
    let alarmNotificationId: string | undefined;

    if (reminderDate.getTime() > Date.now()) {
      reminderNotificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: task.title,
          body: task.description || "Your scheduled task is ready for attention.",
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { type: "task", taskId: task.id }
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderDate,
          channelId: "tasks"
        }
      });
    }

    const alarmDate = getTaskAlarmDate(task);
    if (alarmDate && alarmDate.getTime() > Date.now()) {
      alarmNotificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: task.title,
          body: "The hour of action has arrived. Rise and begin.",
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.MAX,
          sticky: true,
          data: { type: "task-alarm", taskId: task.id }
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: alarmDate,
          channelId: "alarms"
        }
      });
    }

    return { reminderNotificationId, alarmNotificationId };
  },

  async snoozeTaskAlarm(task: Task, minutes: 5 | 10) {
    await this.triggerSnoozeFeedback();
    return Notifications.scheduleNotificationAsync({
      content: {
        title: `${task.title} (Snoozed)`,
        body: `Return to your duty in ${minutes} minutes.`,
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.MAX,
        sticky: true,
        data: { type: "task-alarm", taskId: task.id }
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: minutes * 60,
        channelId: "alarms"
      }
    });
  },

  async cancelTaskNotifications(task: Task) {
    const ids = [task.reminderNotificationId, task.alarmNotificationId].filter(Boolean) as string[];
    await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)));
  },

  async dismissPresentedTaskAlarmNotifications(taskId: string) {
    const presented = await Notifications.getPresentedNotificationsAsync();
    await Promise.all(
      presented
        .filter((item) => item.request.content.data?.taskId === taskId && item.request.content.data?.type === "task-alarm")
        .map((item) => Notifications.dismissNotificationAsync(item.request.identifier).catch(() => undefined))
    );
  }
};
