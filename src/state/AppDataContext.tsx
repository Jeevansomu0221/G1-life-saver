import React, { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppStorageShape, ChatMessage, Task } from "@/types/domain";
import { notificationService } from "@/services/notificationService";
import { storageService } from "@/services/storageService";
import { nextRecurringTaskDate } from "@/utils/date";
import { createId } from "@/utils/id";

type TaskInput = Omit<Task, "id" | "createdAt" | "reminderNotificationId" | "alarmNotificationId">;

type ContextValue = AppStorageShape & {
  hydrated: boolean;
  activeAlarmTaskId?: string;
  addTask: (task: TaskInput) => Promise<void>;
  updateTask: (id: string, updates: TaskInput) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  toggleTaskAlarm: (id: string) => Promise<void>;
  dismissTaskAlarm: (id: string) => Promise<void>;
  snoozeTaskAlarm: (id: string) => Promise<void>;
  addChatMessage: (message: Omit<ChatMessage, "id" | "createdAt">) => Promise<ChatMessage>;
  setActiveAlarmTaskIdFromNotification: (id?: string) => void;
};

const AppDataContext = createContext<ContextValue | null>(null);

export function AppDataProvider({ children }: PropsWithChildren) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeAlarmTaskId, setActiveAlarmTaskId] = useState<string>();
  const tasksRef = useRef<Task[]>([]);
  const chatHistoryRef = useRef<ChatMessage[]>([]);

  const persist = useCallback(async (next: AppStorageShape) => {
    tasksRef.current = next.tasks;
    chatHistoryRef.current = next.chatHistory;
    setTasks(next.tasks);
    setChatHistory(next.chatHistory);
    await storageService.save(next);
  }, []);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

  useEffect(() => {
    async function hydrate() {
      const loaded = await storageService.load();
      const hydratedTasks = await Promise.all(
        loaded.tasks.map(async (task) => {
          const notificationIds = await notificationService.scheduleTask(task);
          return { ...task, ...notificationIds };
        })
      );

      const nextState = {
        tasks: hydratedTasks,
        chatHistory: loaded.chatHistory
      };

      tasksRef.current = nextState.tasks;
      chatHistoryRef.current = nextState.chatHistory;
      setTasks(nextState.tasks);
      setChatHistory(nextState.chatHistory);
      await storageService.save(nextState);
      setHydrated(true);
    }

    hydrate().catch(() => setHydrated(true));
  }, []);

  const addTask = useCallback(
    async (input: TaskInput) => {
      const base: Task = {
        ...input,
        id: createId("task"),
        createdAt: new Date().toISOString()
      };
      const notificationIds = await notificationService.scheduleTask(base);
      await persist({
        tasks: [{ ...base, ...notificationIds }, ...tasks],
        chatHistory
      });
    },
    [chatHistory, persist, tasks]
  );

  const updateTask = useCallback(
    async (id: string, updates: TaskInput) => {
      const previous = tasks.find((task) => task.id === id);
      if (!previous) return;

      const updatedBase: Task = {
        ...previous,
        ...updates,
        reminderNotificationId: previous.reminderNotificationId,
        alarmNotificationId: previous.alarmNotificationId
      };

      const notificationIds = await notificationService.scheduleTask(updatedBase);
      await persist({
        tasks: tasks.map((task) => (task.id === id ? { ...updatedBase, ...notificationIds } : task)),
        chatHistory
      });
    },
    [chatHistory, persist, tasks]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const target = tasks.find((task) => task.id === id);
      if (!target) return;
      await notificationService.cancelTaskNotifications(target);
      await notificationService.dismissPresentedTaskAlarmNotifications(id);
      await persist({
        tasks: tasks.filter((task) => task.id !== id),
        chatHistory
      });
      setActiveAlarmTaskId((current) => (current === id ? undefined : current));
    },
    [chatHistory, persist, tasks]
  );

  const toggleTaskCompletion = useCallback(
    async (id: string) => {
      const target = tasks.find((task) => task.id === id);
      if (!target) return;

      if (!target.completed && target.recurring !== "none") {
        const nextTask: Task = {
          ...target,
          id: createId("task"),
          completed: false,
          dateTime: nextRecurringTaskDate(target.dateTime, target.recurring),
          createdAt: new Date().toISOString(),
          reminderNotificationId: undefined,
          alarmNotificationId: undefined
        };

        const nextNotificationIds = await notificationService.scheduleTask(nextTask);
        await notificationService.cancelTaskNotifications(target);

        const completedTask: Task = {
          ...target,
          completed: true,
          reminderNotificationId: undefined,
          alarmNotificationId: undefined
        };

        await persist({
          tasks: [{ ...nextTask, ...nextNotificationIds }, completedTask, ...tasks.filter((task) => task.id !== id)],
          chatHistory
        });
        return;
      }

      const updatedBase: Task = { ...target, completed: !target.completed };
      const notificationIds = await notificationService.scheduleTask(updatedBase);
      await persist({
        tasks: tasks.map((task) => (task.id === id ? { ...updatedBase, ...notificationIds } : task)),
        chatHistory
      });
    },
    [chatHistory, persist, tasks]
  );

  const toggleTaskAlarm = useCallback(
    async (id: string) => {
      const target = tasks.find((task) => task.id === id);
      if (!target || !target.alarm) return;

      const updatedBase: Task = {
        ...target,
        alarm: {
          ...target.alarm,
          enabled: !target.alarm.enabled
        }
      };
      const notificationIds = await notificationService.scheduleTask(updatedBase);
      await persist({
        tasks: tasks.map((task) => (task.id === id ? { ...updatedBase, ...notificationIds } : task)),
        chatHistory
      });
    },
    [chatHistory, persist, tasks]
  );

  const dismissTaskAlarm = useCallback(async (id: string) => {
    await notificationService.dismissPresentedTaskAlarmNotifications(id);
    setActiveAlarmTaskId((current) => (current === id ? undefined : current));
  }, []);

  const snoozeTaskAlarm = useCallback(
    async (id: string) => {
      const task = tasks.find((item) => item.id === id);
      if (!task?.alarm) return;
      await notificationService.dismissPresentedTaskAlarmNotifications(id);
      await notificationService.snoozeTaskAlarm(task, task.alarm.snoozeMinutes);
      setActiveAlarmTaskId(undefined);
    },
    [tasks]
  );

  const addChatMessage = useCallback(
    async (message: Omit<ChatMessage, "id" | "createdAt">) => {
      const nextMessage: ChatMessage = {
        ...message,
        id: createId("msg"),
        createdAt: new Date().toISOString()
      };
      const nextHistory = [...chatHistoryRef.current, nextMessage];
      await persist({
        tasks: tasksRef.current,
        chatHistory: nextHistory
      });
      return nextMessage;
    },
    [persist]
  );

  const value = useMemo<ContextValue>(
    () => ({
      tasks,
      chatHistory,
      hydrated,
      activeAlarmTaskId,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskCompletion,
      toggleTaskAlarm,
      dismissTaskAlarm,
      snoozeTaskAlarm,
      addChatMessage,
      setActiveAlarmTaskIdFromNotification: setActiveAlarmTaskId
    }),
    [
      activeAlarmTaskId,
      addChatMessage,
      addTask,
      chatHistory,
      deleteTask,
      dismissTaskAlarm,
      hydrated,
      snoozeTaskAlarm,
      tasks,
      toggleTaskAlarm,
      toggleTaskCompletion,
      updateTask
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }
  return context;
}
