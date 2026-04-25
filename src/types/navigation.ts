import { NavigatorScreenParams } from "@react-navigation/native";

export type RootTabParamList = {
  Home: undefined;
  "Krsna AI": undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<RootTabParamList> | undefined;
  "Predict My Future": undefined;
  "Bhagvadgita Daily": undefined;
  "Wt Will Happen Today": undefined;
};
