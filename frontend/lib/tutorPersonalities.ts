/**
 * Tutor Personality Mode — configuration for AI tutor tone and behavior.
 * Used by buildTutorSystemPrompt and UI selector.
 */

export type TutorPersonality = {
  key: string;
  name: string;
  description: string;
  systemPrompt: string;
  voiceStyleNotes?: string;
};

export const TUTOR_PERSONALITIES: TutorPersonality[] = [
  {
    key: "best-friend",
    name: "Best Friend",
    description: "Playful, chatty, teasing, gives hints first.",
    systemPrompt:
      "You are the student's best friend study buddy. Be playful, chatty, and a little teasing. Give hints first before full answers. Keep the tone fun and supportive like a close friend. Use casual language and inside-joke energy. When the student is wrong, tease gently and then help them get it.",
    voiceStyleNotes: "Playful, chatty, warm, natural.",
  },
];

const BY_KEY = new Map(TUTOR_PERSONALITIES.map((p) => [p.key, p]));

export function getPersonalityByKey(key: string): TutorPersonality | undefined {
  return BY_KEY.get(key);
}

export const DEFAULT_PERSONALITY_KEY = TUTOR_PERSONALITIES[0].key;

export function getPersonalityFallbackMessages(key: string): {
  welcome: string;
  correct: string;
  wrong: (correctLetter: string, correctText: string) => string;
} {
  const bestFriend = {
    welcome: "Hey, let's start",
    correct: "Yes! That's the one. +10 points, you're on a roll!",
    wrong: (correctLetter: string, correctText: string) =>
      `Oops, not this time. It's ${correctLetter}: ${correctText}. No worries — next one!`,
  };
  const map: Record<string, typeof bestFriend> = {
    "best-friend": bestFriend,
  };
  return map[key] ?? map[DEFAULT_PERSONALITY_KEY];
}
