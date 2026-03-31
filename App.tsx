import "react-native-gesture-handler";
import React, { useEffect } from "react";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RootNavigator } from "@/navigation/RootNavigator";
import { notificationLinking } from "@/navigation/linking";
import { navigationRef } from "@/navigation/navigationRef";
import { notificationService } from "@/services/notificationService";
import { AppDataProvider, useAppData } from "@/state/AppDataContext";

const isExpoGo = Constants.executionEnvironment === "storeClient";

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true
    })
  });
}

function AppShell() {
  const { setActiveAlarmTaskIdFromNotification } = useAppData();

  useEffect(() => {
    if (isExpoGo) {
      return;
    }

    notificationService.initialize().catch(() => undefined);

    const receiveSub = Notifications.addNotificationReceivedListener((notification) => {
      const taskId = notification.request.content.data?.taskId;
      if (notification.request.content.data?.type === "task-alarm" && typeof taskId === "string") {
        setActiveAlarmTaskIdFromNotification(taskId);
      }
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === "task-alarm" && data?.taskId) {
        setActiveAlarmTaskIdFromNotification(String(data.taskId));
        navigationRef.navigate("MainTabs", { screen: "Tasks", params: { focusType: "tasks" } });
      } else if (data?.type === "task") {
        navigationRef.navigate("MainTabs", { screen: "Tasks", params: { focusType: "tasks" } });
      }
    });

    return () => {
      receiveSub.remove();
      responseSub.remove();
    };
  }, [setActiveAlarmTaskIdFromNotification]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer linking={notificationLinking} ref={navigationRef}>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <AppDataProvider>
      <AppShell />
    </AppDataProvider>
  );
}
