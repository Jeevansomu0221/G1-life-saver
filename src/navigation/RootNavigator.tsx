import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { HomeScreen } from "@/screens/HomeScreen";
import { TasksAlarmsScreen } from "@/screens/TasksAlarmsScreen";
import { KrishnaAIGuideScreen } from "@/screens/KrishnaAIGuideScreen";
import { RootTabParamList } from "@/types/navigation";
import { colors } from "@/theme/colors";

const Tab = createBottomTabNavigator<RootTabParamList>();

function Dot({ focused, tint }: { focused: boolean; tint: string }) {
  return (
    <View
      style={{
        width: focused ? 20 : 10,
        height: 10,
        borderRadius: 999,
        backgroundColor: focused ? tint : "transparent",
        borderWidth: 1,
        borderColor: tint
      }}
    />
  );
}

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#091122",
          borderTopColor: colors.border,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        sceneStyle: { backgroundColor: colors.background }
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused, color }) => <Dot focused={focused} tint={color} />
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksAlarmsScreen}
        options={{
          tabBarIcon: ({ focused, color }) => <Dot focused={focused} tint={color} />
        }}
      />
      <Tab.Screen
        name="Krishna AI Guide"
        component={KrishnaAIGuideScreen}
        options={{
          tabBarIcon: ({ focused, color }) => <Dot focused={focused} tint={color} />
        }}
      />
    </Tab.Navigator>
  );
}
