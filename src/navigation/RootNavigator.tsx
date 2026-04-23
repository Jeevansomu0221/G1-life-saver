import React from "react";
import { ActivityIndicator, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BhagvadgitaDailyScreen } from "@/screens/BhagvadgitaDailyScreen";
import { HomeScreen } from "@/screens/HomeScreen";
import { PredictMyFutureScreen } from "@/screens/PredictMyFutureScreen";
import { PrivacyScreen } from "@/screens/PrivacyScreen";
import { KrishnaAIGuideScreen } from "@/screens/KrishnaAIGuideScreen";
import { WhatWillHappenTodayScreen } from "@/screens/WhatWillHappenTodayScreen";
import { useAppData } from "@/state/AppDataContext";
import { RootStackParamList, RootTabParamList } from "@/types/navigation";
import { colors } from "@/theme/colors";

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

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

function MainTabs() {
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
        name="Krsna AI"
        component={KrishnaAIGuideScreen}
        options={{
          tabBarIcon: ({ focused, color }) => <Dot focused={focused} tint={color} />
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { hydrated } = useAppData();

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        contentStyle: {
          backgroundColor: colors.background
        },
        headerStyle: {
          backgroundColor: colors.background
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          color: colors.text,
          fontWeight: "700"
        }
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Predict My Future" component={PredictMyFutureScreen} />
      <Stack.Screen name="Bhagvadgita Daily" component={BhagvadgitaDailyScreen} />
      <Stack.Screen name="Wt Will Happen Today" component={WhatWillHappenTodayScreen} />
      <Stack.Screen name="Privacy & AI Policy" component={PrivacyScreen} />
    </Stack.Navigator>
  );
}
