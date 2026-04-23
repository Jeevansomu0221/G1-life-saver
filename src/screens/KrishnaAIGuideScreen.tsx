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
import { useIAP } from "expo-iap";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { aiService } from "@/services/aiService";
import { PLUS_SUBSCRIPTION_ID } from "@/services/billingService";
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
    activatePlusPlan,
    aiMessageLimit,
    aiMessagesRemaining,
    canSendAiMessage,
    settings
  } = useAppData();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string>();
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    hasActiveSubscriptions
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      if (purchase.productId !== PLUS_SUBSCRIPTION_ID) {
        return;
      }
      await activatePlusPlan();
      await finishTransaction({ purchase, isConsumable: false });
      setUpgradeOpen(false);
      setBillingLoading(false);
    },
    onPurchaseError: (error) => {
      setBillingError(error.message || "Purchase could not be completed.");
      setBillingLoading(false);
    }
  });

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

  useEffect(() => {
    if (!connected) return;
    fetchProducts({ skus: [PLUS_SUBSCRIPTION_ID], type: "subs" }).catch((error) => {
      setBillingError(error instanceof Error ? error.message : "Could not load subscription details.");
    });
  }, [connected, fetchProducts]);

  const submitMessage = async () => {
    const content = input.trim();
    if (!content || loading) return;

    if (!canSendAiMessage) {
      setUpgradeOpen(true);
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

  const purchasePlus = async () => {
    setBillingLoading(true);
    setBillingError(undefined);
    try {
      const subscription = subscriptions.find((item) => item.id === PLUS_SUBSCRIPTION_ID);
      if (!subscription) {
        throw new Error("G1 Plus is not available yet. Check that g1_plus_monthly is active in Play Console.");
      }
      const offer = subscription?.platform === "android" ? subscription.subscriptionOfferDetailsAndroid?.[0] : undefined;
      if (Platform.OS === "android" && !offer) {
        throw new Error("G1 Plus has no active Google Play subscription offer yet.");
      }
      await requestPurchase({
        request: {
          apple: {
            sku: PLUS_SUBSCRIPTION_ID
          },
          google: {
            skus: [PLUS_SUBSCRIPTION_ID],
            subscriptionOffers: offer ? [{ sku: PLUS_SUBSCRIPTION_ID, offerToken: offer.offerToken }] : []
          }
        },
        type: "subs"
      });
    } catch (error) {
      setBillingError(error instanceof Error ? error.message : "Purchase could not be started.");
      setBillingLoading(false);
    }
  };

  const restorePurchases = async () => {
    setBillingLoading(true);
    setBillingError(undefined);
    try {
      const hasPlus = await hasActiveSubscriptions([PLUS_SUBSCRIPTION_ID]);
      if (!hasPlus) {
        setBillingError("No active G1 Plus subscription was found on this Google Play account.");
        return;
      }
      await activatePlusPlan();
      setUpgradeOpen(false);
    } catch (error) {
      setBillingError(error instanceof Error ? error.message : "Restore could not be completed.");
    } finally {
      setBillingLoading(false);
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
                {settings.aiPlan === "plus" ? "G1 Plus" : "Free"} - {aiMessagesRemaining}/{aiMessageLimit} messages left today
              </Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{settings.aiPlan === "plus" ? "Plus" : "Free"}</Text>
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

        <Modal visible={upgradeOpen} transparent animationType="fade" onRequestClose={() => setUpgradeOpen(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.upgradeCard}>
              <Text style={styles.upgradeTitle}>G1 Plus</Text>
              <Text style={styles.upgradePrice}>Rs 49/month</Text>
              <Text style={styles.upgradeBody}>
                Free users get 20 Krsna AI messages per day. G1 Plus gives you 200 messages per day for deeper daily guidance.
              </Text>
              <View style={styles.planRow}>
                <Text style={styles.planText}>Free</Text>
                <Text style={styles.planValue}>20/day</Text>
              </View>
              <View style={styles.planRow}>
                <Text style={styles.planText}>G1 Plus</Text>
                <Text style={styles.planValue}>200/day</Text>
              </View>
              {billingError ? <Text style={styles.billingError}>{billingError}</Text> : null}
              <Pressable style={[styles.upgradeButton, billingLoading && styles.sendButtonDisabled]} onPress={purchasePlus} disabled={billingLoading}>
                {billingLoading ? <ActivityIndicator color="#231708" size="small" /> : <Text style={styles.upgradeButtonText}>Upgrade with Google Play</Text>}
              </Pressable>
              <Pressable style={styles.restoreButton} onPress={restorePurchases} disabled={billingLoading}>
                <Text style={styles.restoreText}>Restore purchase</Text>
              </Pressable>
              <Pressable style={styles.closeButton} onPress={() => setUpgradeOpen(false)} disabled={billingLoading}>
                <Text style={styles.closeText}>Not now</Text>
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
  upgradeCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: "rgba(216,177,90,0.22)",
    borderRadius: 12,
    padding: 16
  },
  upgradeTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  },
  upgradePrice: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4
  },
  upgradeBody: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
    marginBottom: 12
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 9
  },
  planText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800"
  },
  planValue: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700"
  },
  billingError: {
    color: "#FFB4B4",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8
  },
  upgradeButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gold,
    borderRadius: 10,
    marginTop: 12
  },
  upgradeButtonText: {
    color: "#231708",
    fontSize: 13,
    fontWeight: "900"
  },
  restoreButton: {
    alignItems: "center",
    paddingVertical: 12
  },
  restoreText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800"
  },
  closeButton: {
    alignItems: "center",
    paddingTop: 2
  },
  closeText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700"
  }
});
