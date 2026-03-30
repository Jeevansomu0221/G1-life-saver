import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { aiService } from "@/services/aiService";
import { useAppData } from "@/state/AppDataContext";
import { colors } from "@/theme/colors";

export function KrishnaAIGuideScreen() {
  const { chatHistory, addChatMessage } = useAppData();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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
              content: "Speak plainly, and I shall guide you with clarity, steadiness, and right counsel.",
              createdAt: new Date().toISOString()
            }
          ],
    [chatHistory]
  );

  useEffect(() => {
    const id = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(id);
  }, [conversation, loading]);

  const submitMessage = async () => {
    const content = input.trim();
    if (!content || loading) return;

    setLoading(true);
    setInput("");

    try {
      await addChatMessage({ role: "user", content });
      const reply = await aiService.askKrishna(chatHistory, content);
      await addChatMessage({ role: "assistant", content: reply });
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Krishna AI Guide</Text>
          <Text style={styles.headerSubtitle}>A quiet place for guidance.</Text>
        </View>

        <ScrollView ref={scrollRef} style={styles.chatArea} contentContainerStyle={styles.chatContent} keyboardShouldPersistTaps="handled">
          {conversation.map((message) => (
            <View
              key={message.id}
              style={[styles.bubble, message.role === "assistant" ? styles.assistantBubble : styles.userBubble]}
            >
              <Text style={styles.bubbleRole}>{message.role === "assistant" ? "Krishna" : "You"}</Text>
              <Text style={styles.bubbleText}>{message.content}</Text>
            </View>
          ))}
          {loading ? <ActivityIndicator color={colors.gold} style={styles.loader} /> : null}
        </ScrollView>

        <View style={[styles.inputShell, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Write your question..."
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
            <Text style={styles.sendText}>{loading ? "..." : "Send"}</Text>
          </Pressable>
        </View>
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
    paddingTop: 6,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: "#091121"
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
  chatArea: {
    flex: 1
  },
  chatContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8
  },
  bubble: {
    maxWidth: "88%",
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 16
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#121E35",
    borderWidth: 1,
    borderColor: "rgba(216,177,90,0.18)"
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#17315C"
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
  loader: {
    marginTop: 8
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: "#091121"
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 96,
    borderRadius: 14,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
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
    borderRadius: 14,
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
  }
});
