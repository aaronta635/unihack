/**
 * Voice response for the tutor using OpenAI TTS via backend /tutor/speech.
 * When mode is "voice", call speakTutorReply after adding the text message to chat.
 */

import { getApiBase } from "@/lib/api/client";

export type TutorVoiceOptions = {
  text: string;
  personalityKey?: string;
};

let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;

/**
 * Speak the tutor reply using OpenAI TTS (backend returns audio/mpeg).
 */
export async function speakTutorReply(
  options: TutorVoiceOptions
): Promise<void> {
  const { text, personalityKey } = options;
  if (!text.trim() || typeof window === "undefined") return;

  stopTutorVoice();

  try {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/tutor/speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text.trim(),
        personalityKey: personalityKey ?? undefined,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || "TTS request failed");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    currentObjectUrl = url;
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => {
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
      currentAudio = null;
    };
    audio.onerror = () => {
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
      currentAudio = null;
    };
    await audio.play();
  } catch (err) {
    console.error("Tutor voice error:", err);
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
    currentAudio = null;
  }
}

/**
 * Call once after a user click/tap to "unlock" TTS on strict browsers (e.g. Chrome mobile).
 * Kept for compatibility; OpenAI TTS is played after user gesture when Voice mode is selected.
 */
export function unlockTutorVoice(): void {
  // No-op for OpenAI TTS; playback is triggered by user choosing Voice mode / sending message.
}

/** Stop any current tutor speech. Call when closing the popup or switching mode. */
export function stopTutorVoice(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}
