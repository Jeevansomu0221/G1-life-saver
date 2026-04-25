import React, { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";

type Props = PropsWithChildren<{
  scroll?: boolean;
  contentStyle?: ViewStyle;
  topSafeArea?: boolean;
}>;

export function Screen({ children, scroll = true, contentStyle, topSafeArea = false }: Props) {
  const safeAreaEdges = topSafeArea ? ["top", "left", "right", "bottom"] as const : ["left", "right", "bottom"] as const;

  if (scroll) {
    return (
      <SafeAreaView style={styles.safeArea} edges={safeAreaEdges}>
        <ScrollView style={styles.container} contentContainerStyle={[styles.content, contentStyle]}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={safeAreaEdges}>
      <View style={[styles.container, styles.content, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    flex: 1
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6
  }
});
