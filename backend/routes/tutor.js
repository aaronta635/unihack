const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const { buildTutorSystemPrompt } = require("../lib/buildTutorSystemPrompt");
const { getPersonalityByKey } = require("../lib/tutorPersonalities");

/** Map personality key to OpenAI TTS voice (alloy, echo, fable, onyx, nova, shimmer). */
const PERSONALITY_TO_VOICE = {
  "best-friend": "nova",
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

    const modelToUse = personality?.fineTunedModel;
    if (!modelToUse) {
      return res.status(500).json({
        error: "FT_MODEL_BEST_FRIEND is required. Set it in backend .env.",
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

    const reply = completion.choices[0]?.message?.content?.trim() ?? "I'm not sure how to respond. Try again.";
    res.json({ reply });
  } catch (err) {
    console.error("Tutor chat error:", err);
    res.status(500).json({ error: err.message || "Tutor request failed" });
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
    const voice = getVoiceForPersonality(personalityKey);
    const openai = getOpenAI();
    const response = await openai.audio.speech.create({
      model: process.env.TUTOR_TTS_MODEL || "tts-1",
      voice,
      input: input.slice(0, 4096),
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(buffer);
  } catch (err) {
    console.error("Tutor speech error:", err);
    res.status(500).json({ error: err.message || "TTS request failed" });
  }
});

module.exports = router;
