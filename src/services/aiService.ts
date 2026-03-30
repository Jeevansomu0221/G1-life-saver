import Constants from "expo-constants";
import { Platform } from "react-native";
import { ChatMessage } from "@/types/domain";

const systemPrompt =
  "You are Lord Krishna speaking as a serene, wise, compassionate guide. Draw primarily from the Bhagavad Gita, and when relevant from the Srimad Bhagavatam and Krishna's life in the Mahabharata tradition. Teach dharma, disciplined action, devotion, clarity of mind, fearlessness, and detachment from results. Avoid slang, casual chatbot tone, and empty flattery. Keep replies short, usually 2 to 4 brief lines, with practical spiritual guidance.";

function extractMessage(payload: any) {
  if (typeof payload?.message === "string") {
    return payload.message;
  }

  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => item?.text)
      .filter(Boolean)
      .join("\n");
  }

  if (Array.isArray(payload?.output)) {
    const outputText = payload.output
      .flatMap((item: any) => item?.content ?? [])
      .map((item: any) => item?.text ?? item?.refusal)
      .filter(Boolean)
      .join("\n");

    if (outputText) {
      return outputText;
    }
  }

  return null;
}

export const aiService = {
  async askKrishna(history: ChatMessage[], userMessage: string) {
    const proxyUrl = resolveProxyUrl();
    if (proxyUrl) {
      try {
        const response = await fetch(proxyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            systemPrompt,
            messages: [
              ...history.slice(-12).map((message) => ({
                role: message.role,
                content: message.content
              })),
              { role: "user", content: userMessage }
            ]
          })
        });

        if (response.ok) {
          const payload = await response.json();
          const message = extractMessage(payload);
          if (message) {
            return message;
          }
        }
      } catch {
        // Fall through to direct OpenAI mode for Expo Go and similar dev setups.
      }
    }

    const geminiApiKey = Constants.expoConfig?.extra?.geminiApiKey;
    const model = Constants.expoConfig?.extra?.aiModel ?? "gemini-2.5-flash-lite";

    if (geminiApiKey) {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            generationConfig: {
              maxOutputTokens: 120,
              temperature: 0.7
            },
            contents: [
              ...history.slice(-12).map((message) => ({
                role: message.role === "assistant" ? "model" : "user",
                parts: [{ text: message.content }]
              })),
              {
                role: "user",
                parts: [{ text: userMessage }]
              }
            ]
          })
        }
      );

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text().catch(() => "");
        throw new Error(`Gemini direct mode failed (${geminiResponse.status}). ${errorText || "No error body returned."}`);
      }

      const payload = await geminiResponse.json();
      const geminiMessage = payload?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text).filter(Boolean).join("\n");
      if (geminiMessage) {
        return geminiMessage;
      }

      throw new Error("Gemini direct mode returned an unexpected response.");
    }

    const directApiKey = Constants.expoConfig?.extra?.openAIApiKey;
    if (!directApiKey) {
      throw new Error("The Krishna AI service could not be reached.");
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${directApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        instructions: systemPrompt,
        max_output_tokens: 120,
        input: [
          ...history.slice(-12).map((message) => ({
            role: message.role === "assistant" ? "assistant" : "user",
            content: [{ type: "input_text", text: message.content }]
          })),
          {
            role: "user",
            content: [{ type: "input_text", text: userMessage }]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `OpenAI direct mode failed (${response.status}). ${errorText || "No error body returned."}`
      );
    }

    const payload = await response.json();
    const message = extractMessage(payload);
    if (!message) {
      throw new Error("The Krishna AI service returned an unexpected response.");
    }

    return message;
  },

  fallbackKrishnaReply(userMessage: string) {
    const text = userMessage.toLowerCase();

    if (text.includes("procrast") || text.includes("lazy") || text.includes("delay")) {
      return "Delay weakens the will when you keep feeding it. Do not argue long with the mind. Begin the smallest worthy action now, and let disciplined movement restore your strength.";
    }

    if (text.includes("fear") || text.includes("anxious") || text.includes("scared")) {
      return "Fear visits the mind when it stares too long at imagined outcomes. Return to your duty in this present hour. Courage grows when action becomes greater than hesitation.";
    }

    if (text.includes("confused") || text.includes("lost")) {
      return "When confusion surrounds you, do not seek the whole path at once. Seek the next right step. Perform that step with sincerity, and clarity will follow effort.";
    }

    if (text.includes("sad") || text.includes("pain") || text.includes("heart")) {
      return "Do not mistake sorrow for the end of your strength. Be gentle with your heart, yet do not abandon your dharma. Today, take one act of care and one act of responsibility.";
    }

    return "Speak your difficulty plainly. The mind becomes lighter when truth is faced directly. Stand firm in right action, loosen your attachment to results, and peace will begin to return.";
  }
};

function resolveProxyUrl() {
  const configuredUrl = Constants.expoConfig?.extra?.aiProxyUrl;
  if (configuredUrl) {
    return configuredUrl;
  }

  const runtimeHost =
    (Constants as any)?.expoConfig?.hostUri ??
    (Constants as any)?.expoGoConfig?.debuggerHost ??
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri;

  if (typeof runtimeHost === "string" && runtimeHost.length > 0) {
    const host = runtimeHost.split(":")[0];
    return `http://${host}:3001/api/krishna-guide`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3001/api/krishna-guide";
  }

  return "http://localhost:3001/api/krishna-guide";
}
