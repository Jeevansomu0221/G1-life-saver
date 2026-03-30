import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

type Props<T extends string> = {
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ value, options, onChange }: Props<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={[styles.item, active ? styles.active : undefined]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.text, active ? styles.activeText : undefined]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    marginBottom: 10
  },
  item: {
    flex: 1,
    minHeight: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center"
  },
  active: {
    backgroundColor: colors.primarySoft
  },
  text: {
    color: colors.textMuted,
    fontWeight: "700",
    fontSize: 11
  },
  activeText: {
    color: colors.text
  }
});
