import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "@/theme/colors";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
};

export function PrimaryButton({ label, onPress, variant = "primary", disabled }: Props) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !disabled ? styles.pressed : undefined,
        disabled ? styles.disabled : undefined
      ]}
    >
      <Text style={[styles.text, variant === "ghost" ? styles.ghostText : undefined]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12
  },
  primary: {
    backgroundColor: colors.primary
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border
  },
  danger: {
    backgroundColor: colors.danger
  },
  text: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 12
  },
  ghostText: {
    color: colors.textMuted
  },
  pressed: {
    opacity: 0.88
  },
  disabled: {
    opacity: 0.4
  }
});
