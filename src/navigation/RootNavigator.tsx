import React from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BhagvadgitaDailyScreen } from "@/screens/BhagvadgitaDailyScreen";
import { HomeScreen } from "@/screens/HomeScreen";
import { PredictMyFutureScreen } from "@/screens/PredictMyFutureScreen";
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
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: "#091122",
          borderTopColor: colors.border,
          height: (Platform.OS === "android" ? 62 : 56) + insets.bottom,
          paddingBottom: Math.max(insets.bottom, Platform.OS === "android" ? 10 : 6),
          paddingTop: 6
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
    </Stack.Navigator>
  );
}
