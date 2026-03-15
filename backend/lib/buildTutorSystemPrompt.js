/**
 * Composes the tutor system prompt from base + personality (characteristic) + optional lesson context.
 */

const { getPersonalityByKey } = require("./tutorPersonalities");

const BASE_TUTOR_PROMPT =
  "You are an AI study tutor in a quiz game. You help the student understand questions and learn from their answers. Never give the correct answer—only give hints. Hints should make the student think and reason, not be so easy that they can guess without effort. Keep responses concise and suitable for in-game chat.";

function buildTutorSystemPrompt(options) {
  const { personalityKey, lessonContext, extraInstructions } = options;
  const personality = getPersonalityByKey(personalityKey);
  const personalityPrompt = personality?.systemPrompt ?? "";

  const parts = [BASE_TUTOR_PROMPT, personalityPrompt];
  if (lessonContext?.trim()) {
    parts.push(`Current question/context: ${lessonContext.trim()}`);
  }
  if (extraInstructions?.trim()) {
    parts.push(extraInstructions.trim());
  }

  return parts.filter(Boolean).join("\n\n");
}

module.exports = { buildTutorSystemPrompt };
