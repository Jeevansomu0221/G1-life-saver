export type RecurringTaskType = "none" | "daily" | "weekly" | "monthly";

export type TaskAlarm = {
  enabled: boolean;
  time: string;
  snoozeMinutes: 5 | 10;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  recurring: RecurringTaskType;
  completed: boolean;
  createdAt: string;
  reminderNotificationId?: string;
  alarmNotificationId?: string;
  alarm?: TaskAlarm;
};

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

export type UserSettings = {
  hasCompletedOnboarding: boolean;
  aiPlan: "free" | "plus";
  aiUsage: {
    date: string;
    messagesUsed: number;
  };
  gitaDaily: {
    streakCount: number;
    lastReadDate?: string;
    totalReadSlokas: number;
  };
};

export type AppStorageShape = {
  tasks: Task[];
  chatHistory: ChatMessage[];
  settings: UserSettings;
};
