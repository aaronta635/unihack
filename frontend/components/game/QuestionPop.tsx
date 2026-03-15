"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, Bot, User as UserIcon, ArrowLeft } from "lucide-react";
import type { McqQuestion } from "@/lib/types/entities";
import { useTutorSettings } from "@/contexts/TutorSettingsContext";
import { getPersonalityFallbackMessages } from "@/lib/tutorPersonalities";
import { speakTutorReply, stopTutorVoice } from "@/lib/tutorVoice";
import { api } from "@/lib/api/client";
import TutorPersonalitySelector from "@/components/TutorPersonalitySelector";
import TutorResponseModeToggle from "@/components/TutorResponseModeToggle";

/** One message in the AI chat (user choice or AI tutor response). */
type ChatMessage = {
  id: string;
  text: string;
  sender: "user" | "ai";
};

/** Props for the MCQ block (top section, full width). */
type McqSectionProps = {
  question: McqQuestion;
  selectedOptionIndex: number | null;
  isAnswerRevealed: boolean;
  onOptionSelect: (optionIndex: number) => void;
};

/** Question + MCQ area: top of popup, full width, ~40% height. */
function McqSection({
  question,
  selectedOptionIndex,
  isAnswerRevealed,
  onOptionSelect,
}: McqSectionProps) {
  const correctIndex = question.correct_index;
  const optionLabels = question.options;

  const getOptionButtonStyle = (optionIndex: number): string => {
    if (!isAnswerRevealed) {
      return "bg-gradient-to-r from-slate-800/80 to-slate-700/80 border-cyan-400/40 hover:from-cyan-900/60 hover:to-purple-900/60 hover:border-cyan-300/60 text-white shadow-md hover:shadow-cyan-500/20";
    }
    if (optionIndex === correctIndex) {
      return "bg-gradient-to-r from-green-600/60 to-emerald-600/60 border-green-400/80 text-green-100 shadow-lg shadow-green-500/30";
    }
    if (selectedOptionIndex === optionIndex) {
      return "bg-gradient-to-r from-red-600/60 to-rose-600/60 border-red-400/80 text-red-100 shadow-lg shadow-red-500/30";
    }
    return "bg-slate-900/40 border-slate-700/40 text-slate-500";
  };

  return (
    <div className="relative z-10 flex flex-col h-full min-w-0">
      <div className="flex items-start gap-3 mb-3">
        <motion.div
          className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-md"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-5 h-5 text-white" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-yellow-300 uppercase tracking-wide mb-1">
            Quest Challenge
          </p>
          <p className="text-white font-semibold text-base leading-snug">
            {question.question}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 flex-1 min-h-0 content-start">
        {optionLabels.map((optionText, optionIndex) => (
          <motion.button
            key={optionIndex}
            onClick={() => onOptionSelect(optionIndex)}
            disabled={isAnswerRevealed}
            whileHover={{ scale: isAnswerRevealed ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full text-left py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all duration-300 ${getOptionButtonStyle(
              optionIndex
            )} flex items-center gap-3`}
          >
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white font-black text-center leading-7 text-xs">
              {String.fromCharCode(65 + optionIndex)}
            </span>
            <span className="flex-1 truncate">{optionText}</span>
            {isAnswerRevealed && optionIndex === correctIndex && (
              <Sparkles className="w-5 h-5 text-green-300 flex-shrink-0" />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/** Props for the AI chat (bottom-left, learning-from-AI style). */
type AiChatSectionProps = {
  messages: ChatMessage[];
  onSendUserMessage: (text: string) => void;
  isLoading?: boolean;
};

/** AI chat area: bottom row left, scrollable, user vs AI bubbles. */
function AiChatSection({ messages, onSendUserMessage, isLoading = false }: AiChatSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;
    onSendUserMessage(trimmed);
    setInputValue("");
  };

  return (
    <div className="relative z-10 flex flex-col h-full min-w-0 rounded-2xl border-2 border-[#ffb3c6]/70 bg-white/75 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#ffd6e8] bg-[#ffe6f0]/80 shrink-0">
        <Bot className="w-5 h-5 text-[#c2185b]" />
        <span className="text-sm font-bold text-[#4a2b3e]">AI Study Buddy</span>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
      >
        {messages.length === 0 ? (
          <p className="text-[#8b5a7a] text-sm font-medium italic py-4">
            Chat with your AI tutor here. Answer the question to see explanations.
          </p>
        ) : (
          <>
            {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                  msg.sender === "ai"
                    ? "bg-gradient-to-br from-[#ffc5d0] to-[#ff8a8a]"
                    : "bg-gradient-to-br from-[#ffe6f0] to-[#ffd6e8]"
                }`}
              >
                {msg.sender === "ai" ? (
                  <Bot className="w-5 h-5 text-white" />
                ) : (
                  <UserIcon className="w-5 h-5 text-white" />
                )}
              </div>
              <div
                className={`flex-1 min-w-0 rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed ${
                  msg.sender === "ai"
                    ? "bg-[#ffe6f0] text-[#4a2b3e] border border-[#ffd6e8] text-left"
                    : "bg-[#ffd6e8] text-[#4a2b3e] border border-[#ffb3c6] text-right"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="rounded-2xl px-4 py-3 text-sm text-slate-400 italic bg-slate-700/50 border border-slate-600/50">
                  Tutor is typing...
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-3 py-2 border-t border-[#ffd6e8] bg-[#ffe6f0]/80 shrink-0"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a follow-up or type your thoughts..."
          className="flex-1 rounded-lg bg-white/90 border border-[#ffd6e8] px-3 py-2 text-sm text-[#4a2b3e] placeholder:text-[#b66d94] focus:outline-none focus:ring-2 focus:ring-[#ffb3c6]/60 focus:border-[#ffb3c6]/80"
        />
        <button
          type="submit"
          className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#ffc5d0] to-[#ff8a8a] hover:from-[#ffd0da] hover:to-[#ff9b9b] text-xs font-bold text-[#4a2b3e] border border-[#ffb3c6]/80 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}

/** Compact row: personality selector + response mode toggle (Tutor Personality Mode). */
function TutorControlsRow() {
  const { personalityKey, setPersonalityKey, responseMode, setResponseMode } = useTutorSettings();
  return (
    <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-600/50 shrink-0">
      <TutorPersonalitySelector value={personalityKey} onChange={setPersonalityKey} />
      <TutorResponseModeToggle mode={responseMode} onChange={setResponseMode} />
    </div>
  );
}

/** Placeholder for anime character (bottom-right, narrow column, to implement later). */
function CharacterPlaceholder() {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center w-full h-full min-h-[140px] rounded-3xl border-2 border-dashed border-pink-400/40 bg-pink-500/10">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400/30 to-purple-400/30 flex items-center justify-center mb-2">
        <Sparkles className="w-8 h-8 text-pink-400/60" />
      </div>
      <p className="text-xs font-semibold text-slate-400 text-center px-2">
        Animated character
      </p>
      <p className="text-[10px] text-slate-500 text-center px-2">Coming soon</p>
    </div>
  );
}

/** Props for the full question popup. */
type QuestionPopupProps = {
  target: { question: McqQuestion };
  onAnswer: (correct: boolean) => void;
  onClose?: () => void;
};

/** Persists across Strict Mode remounts so we only send welcome + voice once per question. */
let lastWelcomeQuestionKey: string | null = null;

export default function QuestionPopup({
  target,
  onAnswer,
  onClose,
}: QuestionPopupProps) {
  const question = target.question;
  const { personalityKey, responseMode } = useTutorSettings();
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    null
  );
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTutorLoading, setIsTutorLoading] = useState(false);
  const welcomeSentRef = useRef(false);

  const addChatMessage = useCallback(
    (
      text: string,
      sender: "user" | "ai",
      opts?: { skipVoice?: boolean }
    ) => {
      setChatMessages((prev) => [
        ...prev,
        { id: `msg-${Date.now()}-${prev.length}`, text, sender },
      ]);
      if (
        sender === "ai" &&
        responseMode === "voice" &&
        !opts?.skipVoice
      ) {
        speakTutorReply({ text, personalityKey });
      }
    },
    [responseMode, personalityKey]
  );

  // Reset chat and welcome when question changes (e.g. next checkpoint)
  useEffect(() => {
    welcomeSentRef.current = false;
    setChatMessages([]);
  }, [question]);

  useEffect(() => {
    return () => {
      stopTutorVoice();
    };
  }, []);

  // Stop voice when user switches to Text mode
  useEffect(() => {
    if (responseMode !== "voice") stopTutorVoice();
  }, [responseMode]);

  // AI welcome when popup opens (once per question) — always add message; speak only once (avoids double voice in Strict Mode)
  useEffect(() => {
    const questionKey = question.question ?? "";
    const alreadySpoke = lastWelcomeQuestionKey === questionKey;
    if (!alreadySpoke) lastWelcomeQuestionKey = questionKey;
    welcomeSentRef.current = true;
    const messages = getPersonalityFallbackMessages(personalityKey);
    addChatMessage(messages.welcome, "ai", alreadySpoke ? { skipVoice: true } : undefined);
  }, [question, addChatMessage, personalityKey]);

  const handleOptionSelect = useCallback(
    (optionIndex: number) => {
      if (isAnswerRevealed) return;

      const optionLetter = String.fromCharCode(65 + optionIndex);
      const chosenText = question.options[optionIndex] ?? optionLetter;
      setSelectedOptionIndex(optionIndex);
      addChatMessage(`I chose ${optionLetter}: ${chosenText}`, "user");

      setIsAnswerRevealed(true);
      const isCorrect = optionIndex === question.correct_index;
      const correctLetter = String.fromCharCode(
        65 + question.correct_index
      );
      const correctText = question.options[question.correct_index] ?? "";
      const messages = getPersonalityFallbackMessages(personalityKey);

      if (isCorrect) {
        addChatMessage(messages.correct, "ai");
      } else {
        addChatMessage(messages.wrong(correctLetter, correctText), "ai");
      }

      onAnswer(isCorrect);
    },
    [question, isAnswerRevealed, addChatMessage, onAnswer, personalityKey]
  );

  const handleSendUserMessage = useCallback(
    async (text: string) => {
      addChatMessage(text, "user");
      setIsTutorLoading(true);
      try {
        const apiMessages = [
          ...chatMessages.map((m) => ({
            role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
            content: m.text,
          })),
          { role: "user" as const, content: text },
        ];
        const reply = await api.tutor.chat({
          messages: apiMessages,
          personalityKey,
          lessonContext: question.question,
        });
        addChatMessage(reply, "ai");
      } catch {
        addChatMessage("Sorry, I couldn't get a response. Please try again.", "ai");
      } finally {
        setIsTutorLoading(false);
      }
    },
    [chatMessages, personalityKey, question.question, addChatMessage]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Semi-transparent overlay — game stays visible in background */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-hidden
      />
      {/* Large popup card — inside game, game visible around edges */}
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        transition={{ type: "spring", bounce: 0.3 }}
        className="popup-after-interact relative z-10 w-full max-w-5xl h-full max-h-[85vh] bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 border-4 border-yellow-400/60 rounded-3xl shadow-2xl shadow-yellow-500/30 overflow-hidden flex flex-col"
      >
        {/* Back button — icon only */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Back to game"
            aria-label="Back to game"
            className="absolute top-4 left-4 z-20 flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border-2 border-pink-400/50 text-white shadow-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        {/* Decorative particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Layout: top = Question+MCQ (40%), bottom = AI chat | anime character (60%) */}
        <div className="popup-after-interact__body relative z-10 flex flex-col flex-1 min-h-0 pt-6 pr-6 pb-6 pl-14 gap-5">
          <div className="popup-after-interact__mcq flex flex-col min-h-0 flex-[0_0_40%] border border-white/10 rounded-2xl bg-slate-900/40 p-5 overflow-auto">
            <McqSection
              question={question}
              selectedOptionIndex={selectedOptionIndex}
              isAnswerRevealed={isAnswerRevealed}
              onOptionSelect={handleOptionSelect}
            />
          </div>
          <div className="popup-after-interact__chat-area flex-1 flex gap-4 min-h-0">
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              <TutorControlsRow />
              <AiChatSection
                messages={chatMessages}
                onSendUserMessage={handleSendUserMessage}
                isLoading={isTutorLoading}
              />
            </div>
            <div className="popup-after-interact__character w-32 flex-shrink-0 flex flex-col min-h-0">
              <CharacterPlaceholder />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
