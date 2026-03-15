/**
 * Voice response for the tutor using OpenAI TTS via backend /tutor/speech.
 * Replies are queued: first message is spoken first, then the next, etc.
 */

import { getApiBase } from "@/lib/api/client";

export type TutorVoiceOptions = {
  text: string;
  personalityKey?: string;
};

let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;
const ttsQueue: TutorVoiceOptions[] = [];
let isProcessingQueue = false;

function processQueue(): void {
  if (ttsQueue.length === 0 || isProcessingQueue || typeof window === "undefined") return;
  const item = ttsQueue.shift()!;
  if (!item.text.trim()) {
    processQueue();
    return;
  }
  isProcessingQueue = true;

  const apiBase = getApiBase();
  fetch(`${apiBase}/tutor/speech`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: item.text.trim(),
      personalityKey: item.personalityKey ?? undefined,
    }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("TTS request failed");
      return res.blob();
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      currentObjectUrl = url;
      const audio = new Audio(url);
      currentAudio = audio;
      audio.onended = () => {
        if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = null;
        currentAudio = null;
        isProcessingQueue = false;
        processQueue();
      };
      audio.onerror = () => {
        if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = null;
        currentAudio = null;
        isProcessingQueue = false;
        processQueue();
      };
      return audio.play();
    })
    .catch((err) => {
      console.error("Tutor voice error:", err);
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
      currentAudio = null;
      isProcessingQueue = false;
      processQueue();
    });
}

/**
 * Queue the tutor reply for TTS. Plays in order: first queued = first spoken.
 */
export function speakTutorReply(options: TutorVoiceOptions): void {
  if (!options.text?.trim() || typeof window === "undefined") return;
  ttsQueue.push({
    text: options.text.trim(),
    personalityKey: options.personalityKey,
  });
  processQueue();
}

/**
 * Call once after a user click/tap to "unlock" TTS on strict browsers (e.g. Chrome mobile).
 * Kept for compatibility; OpenAI TTS is played after user gesture when Voice mode is selected.
 */
export function unlockTutorVoice(): void {
  // No-op for OpenAI TTS; playback is triggered by user choosing Voice mode / sending message.
}

/** Stop any current tutor speech and clear the queue. Call when closing the popup or switching mode. */
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
  ttsQueue.length = 0;
}
