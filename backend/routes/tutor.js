const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const { buildTutorSystemPrompt } = require("../lib/buildTutorSystemPrompt");
const { getPersonalityByKey } = require("../lib/tutorPersonalities");

/** Map personality key to OpenAI TTS voice (alloy, echo, fable, onyx, nova, shimmer). */
const PERSONALITY_TO_VOICE = {
  "best-friend": "shimmer",
};

/** OpenAI client for TTS (voice). Uses OPENAI_API_KEY only. */
function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set (used for TTS/voice)");
  return new OpenAI({ apiKey });
}

/** OpenAI client for chat (fine-tuned model). Uses FT_OPENAI_API_KEY only (separate key from voice). */
function getOpenAIForChat() {
  const apiKey = process.env.FT_OPENAI_API_KEY;
  if (!apiKey) throw new Error("FT_OPENAI_API_KEY is required for chat (fine-tuned model)");
  return new OpenAI({ apiKey });
}

function getVoiceForPersonality(personalityKey) {
  const key = typeof personalityKey === "string" ? personalityKey.trim() : "";
  return PERSONALITY_TO_VOICE[key] || "alloy";
}

/**
 * POST /tutor/chat
 * Body: { messages: [{ role: "user"|"assistant", content: string }], personalityKey: string, lessonContext?: string }
 * Response: { reply: string }
 */
router.post("/chat", express.json(), async (req, res) => {
  try {
    const { messages, personalityKey, lessonContext } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required and must not be empty" });
    }
    const key = typeof personalityKey === "string" ? personalityKey.trim() : "best-friend";
    const personality = getPersonalityByKey(key);

    const systemPrompt = buildTutorSystemPrompt({
      personalityKey: key,
      lessonContext: typeof lessonContext === "string" ? lessonContext : undefined,
    });

    const modelToUse =
      (personality && personality.fineTunedModel) ||
      process.env.FT_MODEL_BEST_FRIEND;
    if (!modelToUse || typeof modelToUse !== "string" || !modelToUse.trim()) {
      return res.status(500).json({
        error:
          "FT_MODEL_BEST_FRIEND is required. Add FT_MODEL_BEST_FRIEND=ft:your-model-id to backend/.env and restart the server. Check server console for .env path.",
      });
    }

    console.log("Tutor personality:", key);
    console.log("Model used:", modelToUse);

    const openai = getOpenAIForChat();
    const completion = await openai.chat.completions.create({
      model: modelToUse,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content ?? "").trim() || "(empty)",
        })),
      ],
    });

    const rawContent = completion.choices?.[0]?.message?.content;
    const reply =
      typeof rawContent === "string" && rawContent.trim()
        ? rawContent.trim()
        : "I'm not sure how to respond. Try again.";
    res.json({ reply });
  } catch (err) {
    const apiMessage = err.error?.message || err.message || "Tutor request failed";
    console.error("Tutor chat error:", apiMessage, err);
    res.status(500).json({ error: apiMessage });
  }
});

/**
 * POST /tutor/speech
 * Body: { text: string, personalityKey?: string }
 * Response: audio/mpeg binary
 */
router.post("/speech", express.json(), async (req, res) => {
  try {
    const { text, personalityKey } = req.body || {};
    const input = typeof text === "string" ? text.trim() : "";
    if (!input) {
      return res.status(400).json({ error: "text is required and must not be empty" });
    }
    const personality = getPersonalityByKey(personalityKey);
    const voice = getVoiceForPersonality(personalityKey);
    const model = process.env.TUTOR_TTS_MODEL || "gpt-4o-mini-tts";
    const openai = getOpenAI();
    const payload = {
      model,
      voice,
      input: input.slice(0, 4096),
    };
    if (model.includes("gpt-4o-mini-tts")) {
      const instructions =
        (personality && personality.ttsInstructions) ||
        "Speak naturally with clear, friendly intonation.";
      payload.instructions = String(instructions).slice(0, 4096);
    }
    const response = await openai.audio.speech.create(payload);
    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(buffer);
  } catch (err) {
    console.error("Tutor speech error:", err);
    res.status(500).json({ error: err.message || "TTS request failed" });
  }
});

module.exports = router;
