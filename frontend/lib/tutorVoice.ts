/**
 * Voice response abstraction for the tutor.
 * Placeholder: no TTS yet; integrate real TTS here later (e.g. Web Speech API or external API).
 * When mode is "voice", call speakTutorReply after adding the text message to chat.
 */

export type TutorVoiceOptions = {
  text: string;
  personalityKey?: string;
};

/**
 * Speak the tutor reply as audio. Currently a no-op; add TTS implementation when ready.
 * personalityKey can be used to select voice style (e.g. from tutorPersonalities.voiceStyleNotes).
 */
export function speakTutorReply(_options: TutorVoiceOptions): void {
  // Placeholder: no-op. Later: e.g. Web Speech API synthesis or call to TTS API.
}
