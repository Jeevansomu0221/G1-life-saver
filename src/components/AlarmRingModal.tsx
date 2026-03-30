import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PrimaryButton } from "@/components/PrimaryButton";
import { colors } from "@/theme/colors";
import { formatAlarmTime } from "@/utils/date";

type RingAlarm = {
  id: string;
  label: string;
  time: string;
  snoozeMinutes: 5 | 10;
};

type Props = {
  alarm?: RingAlarm;
  visible: boolean;
  onDismiss: () => void;
  onSnooze: () => void;
};

export function AlarmRingModal({ alarm, visible, onDismiss, onSnooze }: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <LinearGradient colors={["#040814", "#10234C", "#35240E"]} style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.kicker}>Awaken with purpose</Text>
          <Text style={styles.time}>{alarm ? formatAlarmTime(alarm.time) : "--:--"}</Text>
          <Text style={styles.label}>{alarm?.label || "Task Alarm"}</Text>
          <Text style={styles.body}>The moment has arrived. Act with discipline and clarity.</Text>
          <View style={styles.actions}>
            <PrimaryButton label={`Snooze ${alarm?.snoozeMinutes ?? 5}m`} onPress={onSnooze} />
            <PrimaryButton label="Dismiss" onPress={onDismiss} variant="ghost" />
          </View>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: 24
  },
  card: {
    backgroundColor: "rgba(6,11,22,0.95)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(216,177,90,0.35)",
    padding: 24
  },
  kicker: {
    color: colors.gold,
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 8
  },
  time: {
    color: colors.text,
    fontSize: 44,
    fontWeight: "800"
  },
  label: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    marginTop: 10
  },
  body: {
    color: colors.textMuted,
    marginTop: 10,
    lineHeight: 22,
    marginBottom: 24
  },
  actions: {
    gap: 12
  }
});
