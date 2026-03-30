import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "@/theme/colors";

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
};

export function LabeledInput({ label, value, onChangeText, placeholder, multiline }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        style={[styles.input, multiline ? styles.multiline : undefined]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14
  },
  label: {
    color: colors.textMuted,
    marginBottom: 6,
    fontWeight: "600",
    fontSize: 12
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13
  },
  multiline: {
    minHeight: 76,
    textAlignVertical: "top"
  }
});
