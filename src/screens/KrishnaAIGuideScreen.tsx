import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { aiService } from "@/services/aiService";
import { useAppData } from "@/state/AppDataContext";
import { colors } from "@/theme/colors";

function formatMessageTime(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(iso));
}

function splitReplyIntoMessages(text: string) {
  const normalized = text
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (normalized.length > 1) {
    return normalized.slice(0, 3);
  }

  const sentenceParts = text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (sentenceParts.length <= 1) {
    return [text.trim()];
  }

  const grouped: string[] = [];
  let current = "";

  for (const part of sentenceParts) {
    const candidate = current ? `${current} ${part}` : part;
    if (candidate.length > 90 && current) {
      grouped.push(current);
      current = part;
    } else {
      current = candidate;
    }
  }

  if (current) {
    grouped.push(current);
  }

  return grouped.slice(0, 3);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatPlanSubtitle(remaining: number) {
  if (remaining <= 5) {
    return `${remaining} free chats left today`;
  }

  return "Free daily access active";
}

function TypingDots() {
  const a = useRef(new Animated.Value(0.25)).current;
  const b = useRef(new Animated.Value(0.25)).current;
  const c = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const animateDot = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(value, {
            toValue: 0.25,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      );

    const one = animateDot(a, 0);
    const two = animateDot(b, 140);
    const three = animateDot(c, 280);
    one.start();
    two.start();
    three.start();

    return () => {
      one.stop();
      two.stop();
      three.stop();
    };
  }, [a, b, c]);

  return (
    <View style={styles.typingRow}>
      <Animated.View style={[styles.typingDot, { opacity: a }]} />
      <Animated.View style={[styles.typingDot, { opacity: b }]} />
      <Animated.View style={[styles.typingDot, { opacity: c }]} />
    </View>
  );
}

export function KrishnaAIGuideScreen() {
  const {
    chatHistory,
    addChatMessage,
    recordAiMessageUse,
    aiMessagesRemaining,
    canSendAiMessage,
  } = useAppData();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const conversation = useMemo(
    () =>
      chatHistory.length
        ? chatHistory
        : [
            {
              id: "seed",
              role: "assistant" as const,
              content: "Speak plainly, and I shall guide you with clarity and steadiness.",
              createdAt: new Date().toISOString()
            }
          ],
    [chatHistory]
  );

  useEffect(() => {
    const id = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 60);
    return () => clearTimeout(id);
  }, [conversation, loading]);

  const submitMessage = async () => {
    const content = input.trim();
    if (!content || loading) return;

    if (!canSendAiMessage) {
      setLimitOpen(true);
      return;
    }

    setLoading(true);
    setInput("");

    try {
      await addChatMessage({ role: "user", content });
      await recordAiMessageUse();
      const reply = await aiService.askKrishna(chatHistory, content);
      const parts = splitReplyIntoMessages(reply);
      for (let index = 0; index < parts.length; index += 1) {
        if (index > 0) {
          await wait(280);
        }
        await addChatMessage({ role: "assistant", content: parts[index] });
      }
    } catch (error) {
      const diagnostic = error instanceof Error ? ` ${error.message}` : "";
      await addChatMessage({
        role: "assistant",
        content: `${aiService.fallbackKrishnaReply(content)}${diagnostic ? `\n\nConnection note: ${diagnostic.trim()}` : ""}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <LinearGradient colors={["#0E1C36", "#08111F"]} style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.headerTitle}>Krsna AI</Text>
              <Text style={styles.headerSubtitle}>
                {formatPlanSubtitle(aiMessagesRemaining)}
              </Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>Free</Text>
            </View>
          </View>
        </LinearGradient>

        <ImageBackground
          source={require("../../assets/krsna-chat-wallpaper.png")}
          resizeMode="cover"
          style={styles.chatArea}
          imageStyle={styles.chatWallpaper}
        >
          <View style={styles.chatOverlay}>
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.chatContent}
              keyboardShouldPersistTaps="handled"
            >
              {conversation.map((message) => (
                <View key={message.id} style={styles.messageBlock}>
                  <View
                    style={[styles.bubble, message.role === "assistant" ? styles.assistantBubble : styles.userBubble]}
                  >
                    <Text style={styles.bubbleRole}>{message.role === "assistant" ? "Krsna" : "You"}</Text>
                    <Text style={styles.bubbleText}>{message.content}</Text>
                  </View>
                  <Text style={[styles.timeText, message.role === "assistant" ? styles.timeLeft : styles.timeRight]}>
                    {formatMessageTime(message.createdAt)}
                  </Text>
                </View>
              ))}

              {loading ? (
                <View style={styles.messageBlock}>
                  <View style={[styles.bubble, styles.assistantBubble, styles.typingBubble]}>
                    <Text style={styles.bubbleRole}>Krsna</Text>
                    <TypingDots />
                  </View>
                  <Text style={[styles.timeText, styles.timeLeft]}>typing...</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </ImageBackground>

        <View style={[styles.inputShell, { paddingBottom: Math.max(insets.bottom, 8) + 4 }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={canSendAiMessage ? "Your question..." : "Daily free limit reached"}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            multiline
            scrollEnabled
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={submitMessage}
          />
          <Pressable
            style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
            onPress={submitMessage}
            disabled={!input.trim() || loading}
          >
            {loading ? <ActivityIndicator color="#231708" size="small" /> : <Text style={styles.sendText}>Send</Text>}
          </Pressable>
        </View>

        <Modal visible={limitOpen} transparent animationType="fade" onRequestClose={() => setLimitOpen(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.limitCard}>
              <Text style={styles.limitTitle}>Daily AI access finished</Text>
              <Text style={styles.limitBody}>
                Your free Krsna AI chats for today are complete. Please come back tomorrow and your daily access will reset automatically.
              </Text>
              <Pressable style={styles.limitButton} onPress={() => setLimitOpen(false)}>
                <Text style={styles.limitButtonText}>Okay</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  keyboard: {
    flex: 1
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 9,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)"
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  headerSubtitle: {
    color: colors.textMuted,
    marginTop: 2,
    fontSize: 12
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(76,139,245,0.14)",
    borderWidth: 1,
    borderColor: "rgba(76,139,245,0.24)"
  },
  statusText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "700"
  },
  chatArea: {
    flex: 1,
    backgroundColor: "#07101D"
  },
  chatWallpaper: {
    opacity: 0.2
  },
  chatOverlay: {
    flex: 1,
    backgroundColor: "rgba(7,16,29,0.84)"
  },
  chatContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8
  },
  messageBlock: {
    marginBottom: 4
  },
  bubble: {
    maxWidth: "88%",
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 18
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(15,27,48,0.92)",
    borderWidth: 1,
    borderColor: "rgba(216,177,90,0.22)",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(32,77,129,0.94)",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2
  },
  bubbleRole: {
    color: colors.gold,
    fontWeight: "700",
    marginBottom: 4,
    fontSize: 11
  },
  bubbleText: {
    color: colors.text,
    lineHeight: 18,
    fontSize: 13
  },
  timeText: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 3
  },
  timeLeft: {
    marginLeft: 4
  },
  timeRight: {
    alignSelf: "flex-end",
    marginRight: 4
  },
  typingBubble: {
    minWidth: 74
  },
  typingRow: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    minHeight: 14
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.gold
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(9,17,33,0.96)"
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 96,
    borderRadius: 16,
    backgroundColor: "rgba(16,24,43,0.96)",
    borderWidth: 1,
    borderColor: "rgba(216,177,90,0.12)",
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: "top",
    fontSize: 13,
    lineHeight: 18
  },
  sendButton: {
    minWidth: 62,
    minHeight: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gold,
    paddingHorizontal: 12
  },
  sendButtonDisabled: {
    opacity: 0.45
  },
  sendText: {
    color: "#231708",
    fontWeight: "800",
    fontSize: 12
  },
  modalBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.62)",
    padding: 18
  },
  limitCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: "rgba(216,177,90,0.22)",
    borderRadius: 12,
    padding: 16
  },
  limitTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  },
  limitBody: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10
  },
  limitButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gold,
    borderRadius: 10,
    marginTop: 12
  },
  limitButtonText: {
    color: "#231708",
    fontSize: 13,
    fontWeight: "900"
  }
});
