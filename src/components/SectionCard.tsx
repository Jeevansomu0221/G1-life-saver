import React, { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

type Props = PropsWithChildren<{
  title: string;
  subtitle?: string;
  rightLabel?: string;
}>;

export function SectionCard({ title, subtitle, rightLabel, children }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightLabel ? <Text style={styles.rightLabel}>{rightLabel}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: 2,
    fontSize: 12
  },
  rightLabel: {
    color: colors.gold,
    fontWeight: "700",
    fontSize: 12
  }
});
