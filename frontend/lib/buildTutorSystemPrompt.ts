/**
 * Composes the tutor system prompt from base + personality + optional lesson context.
 * Use when calling an LLM for tutor responses.
 */

import { getPersonalityByKey } from "./tutorPersonalities";

const BASE_TUTOR_PROMPT = `You are an AI study tutor in a quiz game. You help the student understand questions and learn from their answers. Keep responses concise and suitable for in-game chat.`;

export type BuildTutorSystemPromptOptions = {
  personalityKey: string;
  lessonContext?: string;
  extraInstructions?: string;
};

export function buildTutorSystemPrompt(options: BuildTutorSystemPromptOptions): string {
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
