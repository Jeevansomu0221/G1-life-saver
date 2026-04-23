import Constants from "expo-constants";
import { Platform } from "react-native";
import { ChatMessage } from "@/types/domain";

const productionProxyUrl = "https://g1-life-saver.onrender.com/api/krishna-guide";

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
  async getTodayPrediction(dateLabel: string) {
    const systemPrompt = buildTodayPredictionSystemPrompt();
    const userMessage = `Create today's prediction for ${dateLabel}.`;
    const proxyUrl = resolveProxyUrl();

    if (proxyUrl) {
      try {
        const response = await fetchWithRetry(proxyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            systemPrompt,
            messages: [{ role: "user", content: userMessage }]
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
        // Fall through only in development auto mode.
      }
    }

    if (!__DEV__) {
      throw new Error("The daily prediction AI backend could not be reached.");
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
              maxOutputTokens: 280,
              temperature: 0.85
            },
            contents: [
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
      throw new Error("The daily prediction AI service could not be reached.");
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
        max_output_tokens: 280,
        input: [
          {
            role: "user",
            content: [{ type: "input_text", text: userMessage }]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`OpenAI direct mode failed (${response.status}). ${errorText || "No error body returned."}`);
    }

    const payload = await response.json();
    const message = extractMessage(payload);
    if (!message) {
      throw new Error("The daily prediction AI service returned an unexpected response.");
    }

    return message;
  },

  async askKrishna(history: ChatMessage[], userMessage: string) {
    const systemPrompt = buildSystemPrompt();
    const proxyUrl = resolveProxyUrl();

    if (proxyUrl) {
      try {
        const response = await fetchWithRetry(proxyUrl, {
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
        // Fall through only in development auto mode.
      }
    }

    if (!__DEV__) {
      throw new Error("The Krsna AI backend could not be reached. Reconnect the backend and try again.");
    }

    const geminiApiKey = Constants.expoConfig?.extra?.geminiApiKey;
    const model = Constants.expoConfig?.extra?.aiModel ?? "gemini-2.5-flash-lite";
    const outputLimit = 90;

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
              maxOutputTokens: outputLimit,
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
      throw new Error("The Krsna AI service could not be reached.");
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
        max_output_tokens: outputLimit,
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
      throw new Error(`OpenAI direct mode failed (${response.status}). ${errorText || "No error body returned."}`);
    }

    const payload = await response.json();
    const message = extractMessage(payload);
    if (!message) {
      throw new Error("The Krsna AI service returned an unexpected response.");
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

function buildSystemPrompt() {
  return "You are Lord Krsna speaking as a serene, wise, compassionate guide. Draw primarily from the Bhagavad Gita, and when relevant from the Srimad Bhagavatam and Krsna's life in the Mahabharata tradition. Teach dharma, disciplined action, devotion, clarity of mind, fearlessness, and detachment from results. Be warm, natural, and conversational without losing dignity. Answer direct factual questions directly first, then add a short spiritual note if useful. For questions about when Krsna appeared on earth, say that in the traditional account Krsna appeared over 5,000 years ago; many traditions place his birth around 3228 BCE and his departure around 3102 BCE, so from 2026 that is roughly 5,250 years since birth and 5,100 years since departure. Distinguish tradition from academic history when needed. If the user writes in English, reply in English. If the user writes in Telugu using English letters, reply naturally in Telugu using English letters. Do not switch from English into Telugu unless the user clearly started in Telugu or asked for Telugu. Keep replies short, usually 1 to 4 brief lines. Use the name Krsna. At most use 1 or 2 gentle emojis when they truly fit.";
}

function buildTodayPredictionSystemPrompt() {
  return `DAILY_PREDICTION_MODE
You create a fun, reflective "what may happen today" reading for a mobile app.
The answer must feel specific and natural, but do not claim certainty or supernatural proof.
Use this exact shape:
Your "Today" Prediction
Date: <date from user>
Morning: <one practical prediction>
Midday: <one practical prediction>
Afternoon: <one practical prediction>
Evening: <one practical prediction>
Night: <one practical prediction>

Wildcard Possibility
<one short paragraph about an unplanned but minor possibility>

Keep it warm, realistic, and easy to read. Avoid medical, legal, financial, crisis, or dangerous advice.`;
}

async function fetchWithRetry(url: string, init: RequestInit, retries = 2) {
  let lastResponse: Response | undefined;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetch(url, init);
    lastResponse = response;
    if (response.status !== 503 || attempt === retries) {
      return response;
    }
    await new Promise((resolve) => setTimeout(resolve, 900 * (attempt + 1)));
  }

  if (!lastResponse) {
    throw new Error("The Krsna AI backend did not respond.");
  }

  return lastResponse;
}

function resolveProxyUrl() {
  const configuredUrl = Constants.expoConfig?.extra?.aiProxyUrl;
  if (configuredUrl) {
    return configuredUrl;
  }

  if (!__DEV__) {
    return productionProxyUrl;
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
