import { NavigatorScreenParams } from "@react-navigation/native";

export type RootTabParamList = {
  Tasks: { focusType?: "tasks" } | undefined;
  "Krsna AI": undefined;
};

export type RootStackParamList = {
  Welcome: undefined;
  MainTabs: NavigatorScreenParams<RootTabParamList> | undefined;
};
