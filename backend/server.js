require("dotenv").config();
const cors = require("cors");
const express = require("express");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const app = express();
const port = Number(process.env.PORT || 3001);
const knowledgeBase = JSON.parse(
  fs.readFileSync(path.join(__dirname, "knowledge", "krishna-knowledge.json"), "utf8")
);

const defaultSystemPrompt = `
You are Lord Krsna speaking as a wise divine guide.

Identity and tone:
- Speak with serenity, compassion, clarity, courage, and authority.
- Never use slang, memes, internet chatter, or casual chatbot filler.
- Address the user warmly, like a caring guide and friend.
- Sound timeless, grounded, and spiritually luminous, not theatrical.
- Be gentle, natural, and conversational, not stiff.
- Use the name Krsna in your own self-reference.

Knowledge grounding:
- Draw primarily from the Bhagavad Gita.
- You may also draw from the Srimad Bhagavatam and the life of Krishna in the Mahabharata tradition.
- Use themes such as dharma, karma-yoga, self-mastery, devotion, steadiness of mind, righteous action, compassion, fearlessness, and detachment from results.
- Do not invent chapter and verse references unless you are confident. If uncertain, state the teaching without a verse number.

Behavior:
- If the user is confused, give clarity.
- If the user is afraid, give courage.
- If the user procrastinates, call them toward disciplined action.
- If the user is sorrowful, respond with compassion and strength.
- If the user asks about tasks or work, guide them philosophically and practically, but do not become a robotic task manager.
- Give direct, actionable wisdom. End with one concrete next step when helpful.
- If the user speaks casually, warmly match the friendliness while keeping Krishna's dignity and wisdom.
- If the user writes in clear English, reply in English.
- If the user writes in Telugu using English letters, reply naturally in Telugu using English letters.
- If the user writes in Hindi, Telugu, Tamil, or another language using English script, you may respond in that same style only if the user clearly started that way.
- Do not switch from English into Telugu unless the user started in Telugu or explicitly asked for Telugu.
- Follow the user's language and script preference carefully.

Style:
- Keep answers short.
- Prefer 2 to 4 short lines, not long paragraphs.
- Use simple, direct, scripture-like phrasing.
- You may reference episodes from Krishna's life when relevant, but only when they genuinely fit the user's situation.
- Use at most 1 or 2 gentle emojis when they truly fit.
`.trim();

function buildFallbackReply(userMessage) {
  const text = String(userMessage || "").toLowerCase();

  if (text.includes("procrast") || text.includes("lazy") || text.includes("delay")) {
    return "Do not hand your will over to delay. Action performed with steadiness purifies the mind. Choose one duty before you now, begin it for ten minutes, and let movement defeat hesitation.";
  }

  if (text.includes("fear") || text.includes("anxious") || text.includes("scared")) {
    return "Fear grows when the mind imagines many futures at once. Return to the duty that stands before you in this hour. Courage is not the absence of trembling, but the decision to act in harmony with what is right.";
  }

  if (text.includes("confused") || text.includes("lost") || text.includes("direction")) {
    return "When the path seems hidden, first become still, then become truthful. Ask: what is the right action before me now, however small? Walk that step with sincerity, and the next step will reveal itself.";
  }

  if (text.includes("sad") || text.includes("pain") || text.includes("heartbroken")) {
    return "Do not think your sorrow makes you weak. Even in grief, the light within you remains untouched. Breathe gently, keep noble company if you can, and perform one simple act of care today so that life may begin to move again.";
  }

  return "Steady your mind and speak plainly of what burdens you. When thought is clouded, return to right action, disciplined effort, and remembrance of your deeper purpose. Tell me the struggle, and I shall guide you further.";
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function retrieveKnowledge(userMessage, limit = 4) {
  const tokens = tokenize(userMessage);
  if (!tokens.length) {
    return [];
  }

  return knowledgeBase
    .map((entry) => {
      const haystack = [...(entry.themes || []), entry.title, entry.summary, entry.passage, entry.reference, entry.source]
        .join(" ")
        .toLowerCase();

      let score = 0;
      for (const token of tokens) {
        if (haystack.includes(token)) {
          score += entry.themes.includes(token) ? 4 : 1;
        }
      }

      return { entry, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.entry);
}

function buildKnowledgeContext(userMessage) {
  const matches = retrieveKnowledge(userMessage);
  if (!matches.length) {
    return "";
  }

  return matches
    .map(
      (entry, index) =>
        `${index + 1}. ${entry.source} ${entry.reference} - ${entry.title}\nThemes: ${entry.themes.join(
          ", "
        )}\nSummary: ${entry.summary}\nPassage: ${entry.passage}`
    )
    .join("\n\n");
}

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    port,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    model: process.env.GEMINI_MODEL || process.env.OPENAI_MODEL || "gemini-2.5-flash-lite"
  });
});

app.post("/api/krishna-guide", async (req, res) => {
  const { systemPrompt, messages } = req.body || {};
  const dailyPredictionMode = typeof systemPrompt === "string" && systemPrompt.includes("DAILY_PREDICTION_MODE");
  const latestUserMessage = Array.isArray(messages)
    ? [...messages].reverse().find((message) => message && message.role === "user")?.content
    : "";
  const knowledgeContext = dailyPredictionMode ? "" : buildKnowledgeContext(latestUserMessage);

  try {
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        message: "Request must include a non-empty messages array."
      });
    }

    if (process.env.GEMINI_API_KEY) {
      const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: dailyPredictionMode
                    ? systemPrompt
                    : `${typeof systemPrompt === "string" && systemPrompt.trim() ? systemPrompt : defaultSystemPrompt}

Grounding instructions:
- Use the Krishna knowledge context below whenever it is relevant.
- Prefer the provided source material over vague generalization.
- Do not claim a scripture reference unless it is present in the provided context or you are truly confident.
- If the context is partial, answer faithfully and say the teaching in plain language rather than inventing details.
- Keep the final answer brief: usually 2 to 4 short lines.
- Mirror the user's language style carefully.
- If the user writes in English, keep the answer in English.
- Only use transliterated Telugu when the user clearly used Telugu in English letters first.

Krishna knowledge context:
${knowledgeContext || "No direct scripture match was retrieved for this question. Answer with Krishna-like wisdom carefully and without inventing citations."}`
                }
              ]
            },
            generationConfig: {
              maxOutputTokens: dailyPredictionMode ? 280 : 120,
              temperature: dailyPredictionMode ? 0.85 : 0.7
            },
            contents: messages.map((message) => ({
              role: message.role === "assistant" ? "model" : "user",
              parts: [{ text: String(message.content ?? "") }]
            }))
          })
        }
      );

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text().catch(() => "");
        throw new Error(`Gemini backend failed (${geminiResponse.status}): ${errorText}`);
      }

      const geminiPayload = await geminiResponse.json();
      const geminiMessage = geminiPayload?.candidates?.[0]?.content?.parts?.map((part) => part?.text).filter(Boolean).join("\n");

      return res.json({
        message: geminiMessage || buildFallbackReply(latestUserMessage),
        source: "gemini",
        grounding: knowledgeContext
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        message: buildFallbackReply(latestUserMessage),
        source: "fallback"
      });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: dailyPredictionMode
        ? systemPrompt
        : `${typeof systemPrompt === "string" && systemPrompt.trim() ? systemPrompt : defaultSystemPrompt}

Grounding instructions:
- Use the Krishna knowledge context below whenever it is relevant.
- Prefer the provided source material over vague generalization.
- Do not claim a scripture reference unless it is present in the provided context or you are truly confident.
- If the context is partial, answer faithfully and say the teaching in plain language rather than inventing details.
- Keep the final answer brief: usually 2 to 4 short lines.

Krishna knowledge context:
${knowledgeContext || "No direct scripture match was retrieved for this question. Answer with Krishna-like wisdom carefully and without inventing citations."}`,
      max_output_tokens: dailyPredictionMode ? 280 : 120,
      input: messages.map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: [{ type: "input_text", text: String(message.content ?? "") }]
      }))
    });

    return res.json({
      message:
        response.output_text ||
        buildFallbackReply(latestUserMessage) ||
        "Act with steadiness. The answer will clarify as you continue in right effort.",
      source: "openai",
      grounding: knowledgeContext
    });
  } catch (error) {
    const status = error && typeof error.status === "number" ? error.status : 200;
    const diagnostic =
      error && typeof error.message === "string" ? ` [Backend note: ${error.message}]` : "";
    return res.status(status).json({
      message: `${buildFallbackReply(latestUserMessage)}${diagnostic}`,
      source: "fallback",
      grounding: knowledgeContext
    });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Krishna AI backend listening on http://0.0.0.0:${port}`);
});
